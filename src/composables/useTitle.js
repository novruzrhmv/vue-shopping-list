export default function useTtitle(t) {
	const appName = 'Shopping list app'
	const title = `${t ? t + ' | ' : ''} ${appName}`
	document.title = title;
}