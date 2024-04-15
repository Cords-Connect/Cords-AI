import { ResourceAddressType } from "../dist";
import type { ResourceType } from "./types";
export * from "./types";

export type SearchOptions = {
	page?: number;
	lat?: number;
	lng?: number;
	distance?: number;
	filter?: {
		"211"?: boolean;
		mentor?: boolean;
		prosper?: boolean;
		magnet?: boolean;
	};
};

export type CordsError = {
	detail: string;
	status: number;
	title: string;
	type: string;
};

export const ResourceOptions = {};

const baseUrl = "https://api.cords.ai";

export const CordsAPI = ({ apiKey }: { apiKey: string }) => {
	const request = async (input: RequestInfo, init?: RequestInit) => {
		const res = await fetch(input, {
			...init,
			headers: {
				"x-api-key": apiKey,
				...init?.headers,
			},
		});
		if (!res.ok) {
			if (res.status === 403)
				throw new Error("Bad API key. Ensure you have a valid API key.");
			const data: CordsError = await res.json();
			if (data.detail) throw new Error(data.detail);
			else throw new Error("An error occurred");
		}
		return res;
	};

	const search = async (q: string, options?: SearchOptions) => {
		const url = new URL("/search", baseUrl);
		const params = new URLSearchParams({
			q,
		});

		// Add top-level parameters
		if (options?.page !== undefined) params.append("page", options.page.toString());
		if (options?.lat !== undefined) params.append("lat", options.lat.toString());
		if (options?.lng !== undefined) params.append("lng", options.lng.toString());
		if (options?.distance !== undefined) params.append("distance", options.distance.toString());

		// Add filter parameters
		if (options?.filter !== undefined) {
			for (const [key, value] of Object.entries(options.filter)) {
				if (value) params.append(`filter[${key}]`, "true");
			}
		}

		const res = await request(`${url}?${params}`);
		const data = await res.json();
		return data as { data: ResourceType[] };
	};

	const related = async (id: string) => {
		const url = new URL(`/resource/${id}/related`, baseUrl);

		const res = await request(`${url}`);
		if (!res.ok) {
			const data: CordsError = await res.json();
			throw new Error(data.detail);
		}
		const data = await res.json();
		return data as { data: ResourceType[] };
	};

	const resource = async (id: string) => {
		const url = new URL(`/resource/${id}`, baseUrl);

		const res = await fetch(url, {
			headers: {
				"x-api-key": apiKey,
			},
		});
		if (!res.ok) {
			const data: CordsError = await res.json();
			throw new Error(data.detail);
		}
		const data = await res.json();
		return data as ResourceType;
	};

	const resourceList = async (ids: string[]) => {
		if (ids.length === 0)
			return {
				data: [],
			};
		const params = new URLSearchParams();
		ids.forEach((id, index) => params.append(`ids[${index}]`, id));

		const url = new URL(`/search?${params.toString()}`, baseUrl);

		const res = await fetch(`${url}`);
		const data = await res.json();
		return data as { data: ResourceType[] };
	};

	return {
		search,
		related,
		resource,
		resourceList,
	};
};

export const formatServiceAddress = (address: ResourceAddressType) => {
	const street1 = address.street1 ? address.street1 + ", " : "";
	const street2 = address.street2 ? address.street2 + ", " : "";
	const city = address.city ? address.city + ", " : "";
	const province = address.province ? address.province + ", " : "";
	const postalCode = address.postalCode ? address.postalCode : "";
	const newAddress = street1 + street2 + city + province + postalCode;
	if (newAddress.endsWith(", ")) {
		return newAddress.slice(0, -2);
	} else return newAddress;
};
