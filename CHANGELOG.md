# Changelog

## 0.0.8

* Do not JSONify already JSONified cloudevents passed to AWS EventBridge.
* Get the cloudevent from `event.details` for AWS EventBridge events.
* Pass both the `event` and `cloudevent` to `func` which may sometimes be different.
* Validate the `id`, `source`, and `type` of the invoking `cloudevent` are present.

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
