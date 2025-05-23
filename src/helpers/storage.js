import AsyncStorage from '@react-native-community/async-storage'

export function getItem(key) {
  return AsyncStorage.getItem(key)
}

export function setItem(key, value) {
  return AsyncStorage.setItem(key, value)
}

export function removeItem(key) {
  return AsyncStorage.removeItem(key)
}
