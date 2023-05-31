import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './';
import bt, {
	IBuyChannelRequest,
	IExchangeRatesResponse,
	IGetInfoResponse,
	IGetOrderResponse
} from '@synonymdev/blocktank-client';
import { TFiatCurrency } from '../utils/exchange-rates';

export type RequestState = 'idle' | 'loading' | 'error';

export type TPublicPage =
	| 'configure'
	| 'confirm'
	| 'payment'
	| 'claim'
	| 'order'
	| 'orders'
	| 'settings'
	| 'terms'
	| 'geoblocked';

export type TNavigationState = {
	page: TPublicPage;
	orderId?: string;
	showMenu?: boolean;
};

export type TSettingsState = {
	currency: TFiatCurrency;
};

export type TState = {
	navigation: TNavigationState;
	settings: TSettingsState;
	info: {
		state: RequestState;
		value: IGetInfoResponse;
	};
	orders: {
		state: RequestState;
		value: IGetOrderResponse[];
	};
	exchangeRates: {
		state: RequestState;
		value: IExchangeRatesResponse;
	};
};

export const initialState: TState = {
	navigation: {
		page: 'configure',
		showMenu: false
	},
	settings: {
		currency: 'USD'
	},
	info: {
		state: 'idle',
		value: {
			capacity: { local_balance: 0, remote_balance: 0 },
			services: [],
			node_info: { active_channels_count: 0, alias: '', public_key: '', uris: [] }
		}
	},
	orders: {
		state: 'idle',
		value: []
	},
	exchangeRates: {
		state: 'idle',
		value: {}
	}
};

export const refreshInfo = createAsyncThunk('bt/refreshInfo', async () => {
	const response = await bt.getInfo();
	// The value we return becomes the `fulfilled` action payload
	return response;
});

export const refreshOrder = createAsyncThunk('bt/refreshOrder', async (orderId: string) => {
	const response = await bt.getOrder(orderId);
	return response;
});

export const placeOrder = createAsyncThunk('bt/placeOrder', async (req: IBuyChannelRequest) => {
	const response = await bt.buyChannel(req);
	return response;
});

export const refreshExchangeRates = createAsyncThunk('bt/refreshExchangeRates', async () => {
	const response = await bt.getRates();
	return response;
});

export const publicStore = createSlice({
	name: 'bt',
	initialState,
	reducers: {
		navigate: (state, action: PayloadAction<TNavigationState>) => {
			state.navigation = {
				...state.navigation,
				...action.payload
			};
		},
		setShowMenu: (state, action: PayloadAction<boolean>) => {
			state.navigation.showMenu = action.payload;
		},
		setCurrency: (state, action: PayloadAction<TFiatCurrency>) => {
			state.settings.currency = action.payload;
		},
		setOrderId: (state, action: PayloadAction<string>) => {
			state.navigation.orderId = action.payload;
		},
		removeOrderId: (state, action: PayloadAction<string>) => {
			state.orders.value = state.orders.value.filter((order) => order._id !== action.payload);
		}
	},
	extraReducers: (builder) => {
		builder
			// Refresh info state updates
			.addCase(refreshInfo.pending, (state) => {
				state.info.state = 'loading';
			})
			.addCase(refreshInfo.rejected, (state, action) => {
				state.info.state = 'error';
			})
			.addCase(refreshInfo.fulfilled, (state, action) => {
				state.info.state = 'idle';
				state.info.value = action.payload;
			})

			// Refresh single order state updates
			.addCase(refreshOrder.pending, (state) => {
				state.orders.state = 'loading';
			})
			.addCase(refreshOrder.rejected, (state) => {
				state.orders.state = 'error';
			})
			.addCase(refreshOrder.fulfilled, (state, action) => {
				state.orders.state = 'idle';

				const updatedOrder = action.payload;

				const orders = state.orders.value;
				let existingOrderIndex = -1;
				orders.forEach((o, index) => {
					if (o._id === updatedOrder._id) {
						existingOrderIndex = index;
					}
				});

				if (existingOrderIndex > -1) {
					state.orders.value[existingOrderIndex] = updatedOrder;
				} else {
					state.orders.value.push(updatedOrder);
				}

				state.orders.value.sort((a, b) => b.created_at - a.created_at);
			})
			// Refresh info exchange rates
			.addCase(refreshExchangeRates.pending, (state) => {
				state.exchangeRates.state = 'loading';
			})
			.addCase(refreshExchangeRates.rejected, (state, action) => {
				state.exchangeRates.state = 'error';
			})
			.addCase(refreshExchangeRates.fulfilled, (state, action) => {
				state.exchangeRates.state = 'idle';
				state.exchangeRates.value = action.payload;
			});
	}
});

export const { navigate, setShowMenu, setCurrency, setOrderId, removeOrderId } =
	publicStore.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectCurrentPage = (state: RootState): TPublicPage => state.bt.navigation.page;
export const selectShowMenu = (state: RootState): boolean => !!state.bt.navigation.showMenu;
export const selectCurrency = (state: RootState): TFiatCurrency => state.bt.settings.currency;
export const selectCurrentOrderId = (state: RootState): string => state.bt.navigation.orderId ?? '';

export const selectInfo = (state: RootState): IGetInfoResponse => state.bt.info.value;
export const selectInfoState = (state: RootState): RequestState => state.bt.info.state;

export const selectOrders = (state: RootState): IGetOrderResponse[] => state.bt.orders.value;
export const selectOrdersState = (state: RootState): RequestState => state.bt.orders.state;

export const selectExchangeRates = (state: RootState): IExchangeRatesResponse =>
	state.bt.exchangeRates.value;
export const selectExchangeRateState = (state: RootState): RequestState =>
	state.bt.exchangeRates.state;

export default publicStore.reducer;
