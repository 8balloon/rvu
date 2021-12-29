import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import { makeAutoObservable, computedFn } from "./libraryImports";
import { ObservableBase, ObservableCollection, ValueSetters } from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";

const observables: ObservableCollection = {};

const methodStack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): T & ValueSetters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }

  const hasHadSettersAdded = addValueSettersWhereNoExist(observableBase); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      const boundMethod = value.bind(observableBase);
      (hasHadSettersAdded as Record<string, Function>)[key] = computedFn(
        (...args: Array<any>) => {
          const stackSnapshot = [...methodStack];
          const methodSignature = `${observableName}.${key}`;
          methodStack.push(methodSignature);
          const result = boundMethod(...args);
          methodStack.pop();
          logResultantState(
            {
              type: methodSignature,
              methodStack: stackSnapshot,
              arg0: args[0],
              args,
            },
            observables
          );
          return result;
        }
      );
    }
  });
  const hasBeenMadeObservable = makeAutoObservable(hasHadSettersAdded); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
