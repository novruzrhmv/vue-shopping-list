export default function useLocalStorage() {
	const getAll = () => {
		return Object.entries(localStorage)
	}

	const getItem = (key) => {
		return localStorage.getItem(key)
	}

	const setItem = (key, value) => {
		localStorage.setItem(key, value)
		return getItem(key);
	}

	const deleteItem = (key) => {
		localStorage.removeItem(key)
	}

	return { getAll, getItem, setItem, deleteItem }
}
