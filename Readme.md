# orgstat

Usage:
```
GITHUB_ORG=orgname GITHUB_TOKEN=your_github_token npm start
```

Output is following:
```
REPOS: 100500 // Total repos in org

BRANCH: master // branch name
TOTAL (MERGED & OPEN): 5 // Open & merged prs to this branch at all repos
MERGED: 4 // Merged prs to this branch at all repos
MERGED PERCENT: 80.00
MIN: 0.54278 // Minimum time (in days) the pr was open
MAX: 20.78 // Maximym time (in days) the pr was open
AVG: 20.19 // Mediana of time the pr was open
CREATE AVG DATE: Tue May 24 2016 23:03:23 GMT+0300 (MSK)
MERGE AVG DATE: Fri May 27 2016 17:24:50 GMT+0300 (MSK)
```
