import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ClusterCultivateApi from "../../axios/clusterCultivate";
import { toast } from "react-toastify";

export const fetchClustersCultivate = createAsyncThunk(
  "clusters/fetchAllClusterCultivate",
  async (_, { rejectWithValue }) => {
    try {
      const res = await ClusterCultivateApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const addClusterCultivate = createAsyncThunk(
  "clusters/addClusterCultivate",
  async (data, { rejectWithValue }) => {
    try {
      console.log(data);
      const res = await ClusterCultivateApi.create(data);
      toast.success("Cluster Cultivate added successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to add Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const clusterCultivateSlice = createSlice({
  name: "clusterCultivate",
  initialState: {
    clusterCultivate: [],
    status: "",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClustersCultivate.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClustersCultivate.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.clusterCultivate = action.payload.data || []; // ✅ FIX
      })
      .addCase(fetchClustersCultivate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add
      .addCase(addClusterCultivate.fulfilled, (state, action) => {
        state.clusterCultivate.push(action.payload.data); // If backend returns {success, data}
      });
  },
});
export default clusterCultivateSlice.reducer;
