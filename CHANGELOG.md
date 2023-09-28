# Changelog

## 0.0.7

* Do not build browser packages because (1) they do not work with many of the node library and (2) they may be messing with the server packages.

## 0.0.6

* Re-add `sort-keys` functionalaity
* Throw kitchen sink of `exports` into `package.json` to (try) to load the correct file given the node runtime environment.

## 0.0.5

* Remove `sort-keys` import to see if that fixes error.

## 0.0.4

* Try fixing build issue with  importing `sort-keys` which is a CommonJS file.

## 0.0.3

* Improve `README.md` to describe required environmental variables.

## 0.0.2

* Fix build issues

## 0.0.1

* Initial commits
