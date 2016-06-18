const GitHubApi = require("github");
const Vow = require("vow");
const TOKEN = process.env.GITHUB_TOKEN;
const ORG = process.env.GITHUB_ORG;

const github = new GitHubApi({
    protocol: "https",
    host: "api.github.com",
    timeout: 5000,
    headers: {
        "user-agent": "orgstat"
    }
});

const DATA = {};
var REPOS = 0;

github.authenticate({
    type: "oauth",
    token: TOKEN
});

function getRepos () {
    var deferred = Vow.defer();

    github.getAllPages(github.repos.getForOrg, {
        org: ORG
    }, function(err, res) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
    });

    return deferred.promise();
}

function processRepo (repo) {
    var deferred = Vow.defer();

    REPOS++;

    github.pullRequests.getAll({
        repo: repo.name,
        user: ORG,
        state: 'all'
    }, function(err, res) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
    });

    return deferred.promise();
}

function processPullRequest(pr) {
    var data;

    if (pr.state === 'open') {
        data = {
            openTime: getOpenTime(pr.created_at, new Date()),
            createdAt: new Date(pr.created_at),
            merged: false
        }
    }
    else if (pr.merged_at !== null) {
        data = {
            openTime: getOpenTime(pr.created_at, pr.merged_at),
            createdAt: new Date(pr.created_at),
            mergedAt: new Date(pr.merged_at),
            merged: true
        };
    }

    if (data) {
        save(pr.head.ref, data);
    }
}

function save(key, data) {
    DATA[key] = DATA[key] || [];

    DATA[key].push(data);
}

function getOpenTime(start, end) {
    return (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
}

function showStats() {
    Object.keys(DATA).sort().forEach((branch) => {
        const prs = DATA[branch];

        const times = prs
            .map(pr => pr.openTime)
            .sort((a, b) => a - b);

        const first = times[0];
        const last = times[prs.length - 1];
        const merged = prs.filter(pr => pr.merged);

        const start = prs
            .map(pr => pr.createdAt.valueOf())
            .sort((a, b) => a - b);

        const end = merged
            .map(pr => pr.mergedAt.valueOf())
            .sort((a, b) => a - b);

        console.log('BRANCH:', branch);
        console.log('TOTAL:', prs.length);
        console.log('MERGED:', merged.length);
        console.log('MERGED, %:', ((merged.length / prs.length) * 100).toFixed(2));
        first && console.log('MIN:', first.toFixed(5));
        last && console.log('MAX:', last.toFixed(2));
        times.length && console.log('AVG:', mediana(times).toFixed(2));
        start.length && console.log('CREATE AVG DATE:', new Date(mediana(start)));
        end.length && console.log('MERGE AVG DATE:', new Date(mediana(end)));
        console.log('');
    });
}

function mediana(arr) {
    var c = arr.length / 2;

    if (arr.length === 1) {
        return arr[0];
    }

    if (arr.length % 2 === 0) {
        return (arr[c] + arr[c - 1]) / 2;
    } else {
        return arr[Math.ceil(c)];
    }
}

getRepos()
    .then(function(repos) {
        return Vow.all(repos.map(function(repo) {
            return processRepo(repo)
                .then(function(prs) {
                    prs.forEach(processPullRequest);
                });
        }));
    })
    .then(function() {
        console.log('REPOS:', REPOS);
        console.log('');

        showStats();
    })
    .fail(function(err) {
        console.log(err);
    });
