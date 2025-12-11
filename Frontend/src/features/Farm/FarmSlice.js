import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import farmAPI from "../../axios/FarmAPI";
import { toast } from "react-toastify";

// ✅ Thunks
export const fetchFarms = createAsyncThunk("farms/fetchFarms", async () => {
  const res = await farmAPI.getAll();
  return res.data;
});
// addFarm
export const addFarm = createAsyncThunk(
  "farms/addFarm",
  async (data, { rejectWithValue }) => {
    console.log(data, "this is the farm data");

    try {
      const res = await farmAPI.create(data);
      toast.success("Farm successfully registered! 🎉");
      return res.data;
    } catch (error) {
      toast.error("Failed to register farm. Please try again.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// updateFarm
export const updateFarm = createAsyncThunk(
  "farms/updateFarm",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await farmAPI.update(id, {
        ...data,
      });
      // Optional console check
      toast.success("Farm details updated successfully! ✅");
      return res.data;
    } catch (error) {
      // console.error("updateFarm ERR", error.response?.status, error.response?.data);
      toast.error("Failed to update farm details. Please try again.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
//TODO - deleteFarm
export const deleteFarm = createAsyncThunk(
  "farms/deleteFarm",
  async (id, { rejectWithValue }) => {
    try {
      const res = await farmAPI.delete(id);
      toast.success("Farm deleted successfully! ✅");
      return res.data;
    } catch (error) {
      // console.error("deleteFarm ERR", error.response?.status, error.response?.data);
      toast.error("Failed to delete farm. Please try again.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const farmSlice = createSlice({
  name: "farms",
  initialState: {
    farms: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFarms.fulfilled, (state, action) => {
        state.loading = false;
        state.farms = action.payload;
      })
      .addCase(fetchFarms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addFarm.pending, (state) => {
        state.loading = true;
      })
      .addCase(addFarm.fulfilled, (state, action) => {
        state.loading = false;
        state.farms.push(action.payload);
      })
      .addCase(addFarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateFarm.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFarm.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.farms.findIndex(
          (farm) => farm.id === action.payload.id
        );
        if (index !== -1) {
          state.farms[index] = action.payload;
        }
      })
      .addCase(updateFarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteFarm.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteFarm.fulfilled, (state, action) => {
        state.loading = false;
        state.farms = state.farms.filter(
          (farm) => farm.id !== action.payload.id
        );
      })
      .addCase(deleteFarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default farmSlice.reducer;
