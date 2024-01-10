<script setup>
import { computed, ref, watch } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import useTitle from '@/composables/useTitle'
import useLocalStorage from '@/composables/useLocalStorage'
import toggleIcon from '@/components/icons/toggleIcon.vue'
import removeIcon from '@/components/icons/removeIcon.vue'

useTitle('Home')

const { setItem, getItem } = useLocalStorage()

const seed = async () => {
	let x = await fetch('data.json')
	items.value = await x.json()
}
const deleteAll = () => (items.value = [])
const title = '⚡ Shopping list app'
const originalItems = JSON.parse(getItem('items')) || []
const tags = ['home', 'work', 'school', 'other']
const priorities = {
	low: 'Low',
	medium: 'Medium',
	high: 'High'
}
const MAX_CHARACTERS = 12
const MIN_SEARCH_CHARACTERS = 3
const items = ref(originalItems)
const filteredItems = ref(originalItems)
const isLoading = ref(false)
const newItem = ref('')
const searchTerm = useDebouncedRef('', 500)
const newItemPriority = ref('low')
const newItemTags = ref([])
const selectedTags = ref([])
const addSelectedTag = (tag) => {
	if (!selectedTags.value.includes(tag)) {
		selectedTags.value.push(tag)
	}
}
const hasItems = computed(() => items.value.length > 0)
const addItem = (e) => {
	const form = e.target
	const id = items.value.length ? items.value.reduce((a, b) => (a.id > b.id ? a : b)).id + 1 : 1
	items.value.push({
		id: id,
		name: newItem.value,
		priority: newItemPriority.value,
		tags: newItemTags.value
	})
	newItem.value = ''
	newItemPriority.value = 'low'
	newItemTags.value = []
	form.reset()
}
const togglePurchased = (id) => {
	const item = items.value.find((item) => item.id === id)
	item.purchased = !item.purchased
}
const removeItem = (id) => {
	items.value = items.value.filter((item) => item.id !== id)
}
const charactersLeft = computed(() => MAX_CHARACTERS - newItem.value.length)

const filterSearch = (term = searchTerm.value) => {
	isLoading.value = true
	if (term.length >= MIN_SEARCH_CHARACTERS)
		filteredItems.value = (filteredItems.value || items.value).filter((item) =>
			item.name.includes(term)
		)
	else if (term.length === 0) {
		if (selectedTags.value) return filterTags()
		else filteredItems.value = items.value
	}
	isLoading.value = false
}
watch(searchTerm, filterSearch)
const filterTags = (tags = selectedTags.value) => {
	isLoading.value = true
	if (tags.length) {
		filteredItems.value = items.value.filter((item) => {
			return tags.every((tag) => item.tags.includes(tag))
		})
		if (searchTerm.value) filterSearch()
	} else filteredItems.value = items.value
	isLoading.value = false
}
watch(selectedTags, filterTags, { deep: true })
const initFilters = () => {
	filterTags()
	filterSearch()
}
watch(
	items,
	() => {
		setItem('items', JSON.stringify(items.value))
		initFilters()
	},
	{ deep: true }
)
</script>
<template>
	<div class="list">
		<h1 class="text-4xl my-6 font-bold text-gray-600 text-center">{{ title }}</h1>
		<form class="flex flex-wrap gap-2 items-start *:order-1" @submit.prevent="addItem">
			<label class="flex flex-col flex-1">
				<input
					type="text"
					placeholder="Add an item"
					class="border rounded p-2 focus:outline-blue-400"
					v-model="newItem"
					name="name"
					:maxlength="MAX_CHARACTERS"
					required
				/>
				<span class="italic text-xs">{{ charactersLeft }} character left</span>
			</label>
			<select
				v-model="newItemPriority"
				class="border rounded p-2 focus:outline-blue-400"
				name="priority"
				required
			>
				<option v-for="(priority, key) in priorities" :value="key" :key="priority">
					{{ priority }}
				</option>
			</select>
			<ul class="flex-1 basis-full flex flex-wrap gap-3 !order-2">
				<label
					v-for="tag in tags"
					:key="tag"
					class="flex items-center gap-1 cursor-pointer"
				>
					<input
						type="checkbox"
						v-model="newItemTags"
						name="tags[]"
						class="w-4 h-4 text-sky-500 bg-gray-100 border-gray-300 rounded focus:ring-sky-600 cursor-pointer"
						:value="tag"
					/>
					{{ tag.charAt(0).toUpperCase() + tag.slice(1) }}
				</label>
			</ul>

			<button
				class="flex-1 shrink-0 bg-sky-400 text-white px-4 py-2 rounded transition hover:bg-sky-600 hover:disabled:bg-slate-600 disabled:bg-slate-400 cursor-pointer disabled:cursor-not-allowed"
				type="submit"
				:disabled="!newItem.length"
			>
				Add item
			</button>
		</form>
		<section class="flex flex-wrap gap-2 mt-4">
			<button
				@click="seed"
				class="flex-1 shrink-0 bg-green-600 text-white px-4 py-2 rounded transition hover:bg-green-700 hover:disabled:bg-slate-600 disabled:bg-slate-400 cursor-help disabled:cursor-not-allowed whitespace-nowrap"
				type="button"
				title="This button seeds dummy data for quick testing of the app"
			>
				Seed dummy data
			</button>
			<button
				@click="deleteAll"
				class="flex-1 shrink-0 bg-red-600 text-white px-4 py-2 rounded transition hover:bg-red-700 hover:disabled:bg-slate-600 disabled:bg-slate-400 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
				type="button"
				:disabled="!hasItems"
			>
				Delete all
			</button>
		</section>
		<section id="search" class="mt-4">
			<label class="flex flex-col">
				<input
					type="text"
					placeholder="Search..."
					class="flex-1 border rounded py-2 px-3 focus:outline-blue-400"
					v-model.trim="searchTerm"
					name="search"
					debounce="2000"
				/>
				<span class="italic text-xs">
					Min 3 character.
					<span v-if="searchTerm.length >= MIN_SEARCH_CHARACTERS"
						>Result for {{ searchTerm }}</span
					></span
				>
			</label>
		</section>

		<section v-if="selectedTags.length" class="flex items-center gap-2 mt-2">
			Selected tags:
			<ul class="flex">
				<li v-for="tag in selectedTags" :key="tag" class="inline-flex mr-1.5">
					<label>
						<input type="checkbox" :value="tag" v-model="selectedTags" class="hidden" />
						<span
							class="inline-flex text-sm bg-sky-500 hover:bg-sky-600 transition text-white rounded px-2 py-1 cursor-pointer"
						>
							<span class="mr-1">x</span>
							{{ tag }}
						</span>
					</label>
				</li>
			</ul>
		</section>
		<img v-if="isLoading" src="./assets/icons/loading.svg" alt="" class="py-4 px-24" />
		<ul v-if="filteredItems.length" class="flex flex-col gap-2 mt-6 pb-4">
			<li
				v-for="{ id, name, purchased, priority, tags } in filteredItems"
				:key="id"
				class="flex items-center"
			>
				<div class="flex flex-col mr-auto text-xl">
					<span
						:class="{
							'text-red-600': !purchased && priority === 'high',
							'text-orange-400': !purchased && priority === 'medium',
							'text-sky-600': !purchased && priority === 'low',
							'line-through text-slate-400': purchased
						}"
						class="inline-flex items-center mb-1.5"
					>
						<span
							:class="{
								'bg-red-600': !purchased && priority === 'high',
								'bg-orange-400': !purchased && priority === 'medium',
								'bg-sky-600': !purchased && priority === 'low',
								'line-through bg-slate-400': purchased
							}"
							class="inline-flex rounded text-white text-center mr-1 px-1.5 py-0.5 text-xs"
						>
							{{ priority }} </span
						>{{ name }}
					</span>
					<div class="flex gap-1">
						<span
							v-for="tag in tags"
							:key="tag"
							@click="addSelectedTag(tag)"
							class="inline-flex text-xs bg-sky-500 hover:bg-sky-600 transition text-white rounded px-1 py-0.5 cursor-pointer"
							>#{{ tag }}</span
						>
					</div>
				</div>
				<button
					id="purchased"
					class="text-white rounded w-12 grid place-items-center p-2 transition"
					:class="{
						'bg-slate-500 hover:bg-slate-600': purchased,
						'bg-emerald-500 hover:bg-emerald-600': !purchased
					}"
					@click="togglePurchased(id)"
				>
					<toggleIcon />
				</button>
				<button
					id="remove"
					class="text-white rounded w-12 grid place-items-center p-2 transition bg-red-500 hover:bg-red-600 ml-2"
					@click="removeItem(id)"
				>
					<removeIcon />
				</button>
			</li>
		</ul>
		<p v-else class="mt-4 italic font-semibold">No items yet</p>
	</div>
</template>
