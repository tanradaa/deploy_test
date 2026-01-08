export async function getStores() {
  return fetch("/api/stores").then(res => res.json());
}

export async function getStoreData(storeId: string) {
  return fetch(`/api/storeData?storeId=${storeId}`).then(res => res.json());
}

export type StoreKey = string;