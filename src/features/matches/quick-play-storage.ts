const storageWarning =
  "This browser couldn’t save or restore Quick Play. You can keep playing here, but your latest changes may be lost if you reload or leave. Allow browser storage or free up space, then make a change to retry.";

export function readQuickPlayStorage(key: string) {
  try {
    return { value: localStorage.getItem(key), warning: "" };
  } catch {
    return { value: null, warning: storageWarning };
  }
}

export function writeQuickPlayStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return "";
  } catch {
    return storageWarning;
  }
}
