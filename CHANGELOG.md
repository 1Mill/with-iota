# Changelog

## 0.2.0

* Add `MutationVersion` export.

### Breaking changes

* Wrap `CREATE`, `DELETE`, `INCREMENT`, and `SET` exports under `MutationAction` (e.g. `MutationAction.SET`).

## 0.1.0

### Breaking changes

* Change `mutation.type` to `mutation.table`.
* Run `rapids.commit(...)` outside of `journal.erase(...)` lifecycle, instead of inside, so that connection errors do not erase any committed mutations.

## 0.0.12

* Add `rn_` prefix to `id` attributes on `CREATE` mutation action.
* Increase `id` length from `21` to `36` to reduce chance of collisions.
* Upgrade `@1mill/cloudevents` from `^4.6.1` to `^5.1.0`.
* Upgrade `@aws-sdk/client-eventbridge` from `^3.418.0` to `^3.645.0`.
* Upgrade `mongodb` from `^6.1.0` to `^6.8.1`.
* Upgrade `nanoid` from `^3.3.6` to `^3.3.7`.
* Upgrade `radash` from `^11.0.0` to `^12.1.0`.

## 0.0.11

* Fix build for `.cjs` / `require()` syntax.

## 0.0.10

* Add read-only helpers `find`, `findOne`, `distinct`, and `countDocuments` to read database records from `mongo`.

## 0.0.9

* Do JSONify already cloudevents passed AWS EventBridge.
* Validate the `id`, `source`, and `type` of the invoking `cloudevent` are strings.

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
