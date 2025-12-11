import React, { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllClustersProduct,
  createClusterProduct,
} from "../../features/ClusterProducts/ClusterProducts";
import { toast } from "react-toastify";

const ClusterProducts = () => {
  const { list } = useSelector((state) => state.secondClusterProducts);

  console.log(list);

  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    hsn: "",
    rate: "",
    sale: "",
  });
  const handleSubmitClusterProduct = (e) => {
    e.preventDefault();
    dispatch(createClusterProduct(formData))
      .then((res) => {
        console.log(res);
        toast("Cluster Products Created Successfully");
        setFormData({
          name: "",
          hsn: "",
          rate: "",
          sale: "",
        });
      })
      .catch((err) => {
        toast("error While Creting Products", err);
      });
  };

  useEffect(() => {
    dispatch(fetchAllClustersProduct());
  }, [dispatch]);

  const handleFillInput = (e) => {
    e.preventDefault();
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <div>
      <div>
        <form onSubmit={handleSubmitClusterProduct}>
          <div>
            <div>
              <label>Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFillInput}
              />
            </div>
            <div>
              <label>HSN Number</label>
              <input
                type="text"
                name="hsn"
                value={formData.hsn}
                onChange={handleFillInput}
              />
            </div>
            <div>
              <label>Purchase Rate </label>
              <input
                type="text"
                name="rate"
                value={formData.rate}
                onChange={handleFillInput}
              />
            </div>
            <div>
              <label>Sales Rate</label>
              <input
                type="text"
                name="sale"
                value={formData.sale}
                onChange={handleFillInput}
              />
            </div>
            <div>
              <button type="submit">Create Product</button>
            </div>
          </div>
        </form>
      </div>

      <div>
        <table>
          <thead className="border">
            <tr>
              <th className="border">Products Name</th>
              <th className="border">HSN Number</th>
              <th className="border">Purchase Rate</th>
              <th className="border">Sales Rate</th>
              <th className="border">Action</th>
            </tr>
          </thead>
          <tbody className="border">
            {list?.map((item) => {
              return (
                <tr key={item?.id} className="">
                  <td className="border ">{item?.name}</td>
                  <td className="border ">{item?.hsn_number}</td>
                  <td className="border ">{item?.purchase_rate}</td>
                  <td className="border ">{item?.sale_rate}</td>
                  <td className="border ">
                    <button>✏️</button>
                    <button>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClusterProducts;
