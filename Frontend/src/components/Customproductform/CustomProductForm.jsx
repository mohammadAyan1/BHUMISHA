import React, { useState, useEffect, useRef } from "react";
import productAPI from "../../axios/productAPI";
import categoryAPI from "../../axios/categoryAPI";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CustomProductForm = () => {
  const [selectedCustomProduct, setSelectedCustomProduct] = useState(null);
  const navigate = useNavigate();
  const param = useParams();

  

  useEffect(() => {
    if (!param?.id) return;

    productAPI.getCustomProductById(param?.id).then((res) => {
      

      const data = res?.data; // because your backend returns [product]
      if (!data) return;

      

      setSelectedCustomProduct(data?.ingredients);

      setCustomName(data.product_name);
      setCategorySearch(data.category_name);
      setCustomPurchaseRate(data.purchase_rate);
      setTransportRate(data.transport_charge);
      setLocalTransport(data.local_transport);
      setPackagingCost(data.packaging_cost);
      setHsnCode(data.hsn_code);
      setCustomSaleRate(data?.total);
      setGst(data.gst);
      setCustomQty(data.size);
      setEditQTY(data?.ingredientsData?.map((i) => i.qty));
      setSelectedCategory({ id: data?.category_id });

      // ✅ Set ingredients (ingredient products)
      const ingredientRows =
        data.ingredientsData?.map((i) => ({
          id: i.id,
          product: i.product,
          productId: i.productId,
          availableQty: i.size,
          qty: i.qty || "",
          rate: i.value || 0,
          gst: i.gst || "",
          salesRate: i.total || "",
          categoryId: i.category_id || "",
          showDropdown: false,
          dropdownIndex: -1,
          productSearch: i.product_name,
        })) || [];

      setProductRows(ingredientRows);
    });
  }, []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownIndex, setCategoryDropdownIndex] = useState(-1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editQTY, setEditQTY] = useState("");
  const [stockUpdates, setStockUpdates] = useState({});

  const [productRows, setProductRows] = useState([
    {
      id: Date.now(),
      product: "",
      productId: null,
      availableQty: 0,
      qty: "",
      rate: "",
      salesRate: "",
      showDropdown: false,
      dropdownIndex: -1,
      productSearch: "",
    },
  ]);

  // Top fields
  const [customName, setCustomName] = useState("");
  const [transportRate, setTransportRate] = useState("");
  const [localTransport, setLocalTransport] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [gst, setGst] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customPurchaseRate, setCustomPurchaseRate] = useState("");
  const [customSaleRate, setCustomSaleRate] = useState("");
  const [value, setValue] = useState(0);
  const [margin30, setMargin30] = useState("");
  const [margin25, setMargin25] = useState("");

  const inputRefs = useRef([]);
  const categoryDropdownRef = useRef(null);
  const productDropdownRefs = useRef({});

  useEffect(() => {
    
  }, [stockUpdates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close category dropdown
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }

      // Close product dropdowns
      Object.keys(productDropdownRefs.current).forEach((rowId) => {
        const ref = productDropdownRefs.current[rowId];
        if (ref && !ref.contains(event.target)) {
          setProductRows((prev) =>
            prev.map((row) =>
              row.id === parseInt(rowId)
                ? { ...row, showDropdown: false, dropdownIndex: -1 }
                : row
            )
          );
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Fetch categories and products
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoryRes = await categoryAPI.getAll();
        setCategories(categoryRes?.data || []);

        // Fetch products
        const productRes = await productAPI.getAll();
        setProducts(productRes?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Auto focus on first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  // Auto-calc value and margins
  // useEffect(() => {
  //   const total =
  //     (Number(customPurchaseRate) || 0) +
  //     (Number(transportRate) || 0) +
  //     (Number(localTransport) || 0) +
  //     (Number(packagingCost) || 0);
  //   setValue(total.toFixed(2));
  //   setMargin30(((total * 30) / 100).toFixed(2));
  //   setMargin25(((total * 25) / 100).toFixed(2));
  //   setCustomSaleRate(((total * 50) / 100 + total).toFixed(2)); // 50% margin
  // }, [customPurchaseRate, transportRate, localTransport, packagingCost]);

  // useEffect(() => {
  //   const total = (Number(customSaleRate) || 0) + (Number(packagingCost) || 0);
  //   setMargin30(((total * 30) / 100).toFixed(2));
  //   setMargin25(((total * 25) / 100).toFixed(2));
  //   setCustomSaleRate(((total * 50) / 100 + total).toFixed(2)); // 50% margin
  // }, [customSaleRate, packagingCost]);

  useEffect(() => {
    // Convert inputs to numbers safely
    const sale = Number(customSaleRate) || 0;
    const packaging = Number(packagingCost) || 0;

    const total = sale + packaging;

    setMargin30((total * 0.3).toFixed(2));
    setMargin25((total * 0.25).toFixed(2));
  }, [customSaleRate, packagingCost]);

  // Handle Enter key to move to next field
  const handleEnterNext = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  // Category dropdown search + keyboard navigation
  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase()?.includes(categorySearch.toLowerCase())
  );

  const handleCategoryKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex =
        categoryDropdownIndex < filteredCategories.length - 1
          ? categoryDropdownIndex + 1
          : 0;
      setCategoryDropdownIndex(newIndex);

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement = categoryDropdownRef.current?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        categoryDropdownIndex > 0
          ? categoryDropdownIndex - 1
          : filteredCategories.length - 1;
      setCategoryDropdownIndex(newIndex);

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement = categoryDropdownRef.current?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const category = filteredCategories[categoryDropdownIndex];
      if (category) {
        setSelectedCategory(category);
        setCategorySearch(category.name);
        setShowCategoryDropdown(false);
        setTimeout(() => inputRefs.current[3]?.focus(), 200);
      }
    } else if (e.key === "Escape") {
      setShowCategoryDropdown(false);
    }
  };

  // Product dropdown handlers for each row
  const handleProductSearchChange = (rowId, value) => {
    setProductRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productSearch: value,
              showDropdown: true,
              dropdownIndex: -1,
            }
          : row
      )
    );
  };

  const handleProductKeyDown = (e, rowId) => {
    const row = productRows.find((r) => r.id === rowId);
    if (!row) return;

    const filtered = products.filter((p) =>
      p.product_name?.toLowerCase().includes(row.productSearch.toLowerCase())
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex =
        row.dropdownIndex < filtered.length - 1 ? row.dropdownIndex + 1 : 0;
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, dropdownIndex: newIndex } : r
        )
      );

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement =
          productDropdownRefs.current[rowId]?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        row.dropdownIndex > 0 ? row.dropdownIndex - 1 : filtered.length - 1;
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, dropdownIndex: newIndex } : r
        )
      );

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement =
          productDropdownRefs.current[rowId]?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (row.dropdownIndex >= 0 && row.dropdownIndex < filtered.length) {
        const product = filtered[row.dropdownIndex];
        handleProductSelect(rowId, product);
      }
    } else if (e.key === "Escape") {
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, showDropdown: false, dropdownIndex: -1 } : r
        )
      );
    }
  };

  const handleProductSelect = (rowId, product) => {
    // Check if product has available quantity

    const availableQty = product.size || 0;

    setProductRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              product: product.product_name,
              productId: product.id,
              availableQty: availableQty,
              rate: product.purchase_rate || "",
              salesRate: product.total,
              productSearch: product.product_name,
              showDropdown: false,
              dropdownIndex: -1,
            }
          : row
      )
    );
  };

  const handleQtyChange = (rowId, value) => {
    

    setProductRows((prev) =>
      prev.map((r, i) => {
        if (r.id === rowId) {
          const qty = Number(value);
          

          if (param?.id) {
            const alreadyQty = Number(editQTY?.[i] || 0);
            const availableQty = Number(r.availableQty || 0);
            const allowedQty = availableQty + alreadyQty;
            

            const qtyIncrese = qty - alreadyQty;

            

            if (qty > allowedQty) {
              alert("❌ Quantity exceeds available stock!");
              return { ...r, qty: allowedQty }; // clamp to max allowed
            }
            

            setStockUpdates((prevUpdates) => ({
              ...prevUpdates,
              [rowId]: {
                productId: rowId,
                updatedQty: qtyIncrese,
              },
            }));

            return { ...r, qty };
          } else {
            if (qty > r.availableQty) {
              alert("❌ Quantity exceeds available stock!");
              return { ...r, qty: r.availableQty };
            }
            return { ...r, qty };
          }
        }
        return r;
      })
    );
  };

  const handleAddRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        productId: null,
        availableQty: 0,
        qty: "",
        rate: "",
        showDropdown: false,
        dropdownIndex: -1,
        productSearch: "",
      },
    ]);
  };

  const handleRemoveRow = (id) => {
    setProductRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = () => {
    // const customSaleRate = customSaleRate + packagingCost;
    const payload = {
      customProductName: customName,
      categoryId: selectedCategory?.id || null,
      hsnCode,
      gst,
      customQty,
      transportRate,
      localTransport,
      packagingCost,
      value,
      margin30,
      margin25,
      customPurchaseRate,
      customSaleRate: Number(customSaleRate) + Number(packagingCost),
      stockUpdates,
      selectedProductIds: productRows.map((r) => r).filter(Boolean),
    };
    

    if (param?.id) {
      

      productAPI
        .updateCustomProduct(param?.id, payload)
        .then(() => {
          toast.success("Custom product Updated successfully ");
          navigate(-1);
        })
        .catch(() => {
          toast.error("Custom product did not updated");
        });
    } else {
      productAPI
        .createCustom(payload)
        .then(() => {
          toast.success("Custom product add successfully ");
          setProducts([]);
          setCategories([]);
          setSelectedCategory(null);
          setCategorySearch("");
          setCategoryDropdownIndex(-1);
          setShowCategoryDropdown(false);
          setEditQTY("");
          setStockUpdates({});
          setProductRows([
            {
              id: Date.now(),
              product: "",
              productId: null,
              availableQty: 0,
              qty: "",
              rate: "",
              salesRate: "",
              showDropdown: false,
              dropdownIndex: -1,
              productSearch: "",
            },
          ]);
          setCustomName("");
          setTransportRate("");
          setLocalTransport("");
          setPackagingCost("");
          setHsnCode("");
          setGst("");
          setCustomQty("");
          setCustomPurchaseRate("");
          setCustomSaleRate("");
          setValue(0);
          setMargin30("");
          setMargin25("");
          setSelectedCustomProduct(null);
        })
        .catch(() => {
          toast.error("Custom product did not added");
        });
    }
  };

  const selectedCount = productRows.filter((r) => r.product).length;

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Custom Product Form
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-md">
        {/* Product Name */}
        <div className="flex flex-col">
          <label>product name</label>
          <input
            ref={(el) => (inputRefs.current[0] = el)}
            type="text"
            placeholder="Product Name"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 0)}
          />
        </div>

        {/* Category */}
        <div className="relative">
          <label>Select category</label>
          <input
            ref={(el) => (inputRefs.current[1] = el)}
            type="text"
            placeholder="Select Category"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full"
            value={categorySearch}
            onFocus={() => setShowCategoryDropdown(true)}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setShowCategoryDropdown(true);
              setCategoryDropdownIndex(-1);
            }}
            onKeyDown={handleCategoryKeyDown}
          />
          {showCategoryDropdown && (
            <ul
              ref={categoryDropdownRef}
              className="absolute bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto w-full z-20"
            >
              {filteredCategories.map((c, i) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c);
                    setCategorySearch(c.name);
                    setShowCategoryDropdown(false);
                    inputRefs.current[2]?.focus();
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    i === categoryDropdownIndex
                      ? "bg-blue-100 border-blue-500 border"
                      : ""
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom Sale Rate */}
        <div className="flex flex-col">
          <label>Rate</label>
          <input
            ref={(el) => (inputRefs.current[2] = el)}
            type=""
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={Number(customSaleRate) || ""}
            placeholder="Custom Sale Rate"
            onChange={(e) => setCustomSaleRate(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 2)}
          />
        </div>

        {/* Purchase Rate */}
        {/* <input
          ref={(el) => (inputRefs.current[2] = el)}
          type="number"
          placeholder="Purchase Rate"
          className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={customPurchaseRate}
          onChange={(e) => setCustomPurchaseRate(e.target.value)}
          onKeyDown={(e) => handleEnterNext(e, 2)}
        /> */}

        {/* Transport Rate */}
        {/* <input
          ref={(el) => (inputRefs.current[3] = el)}
          type="number"
          placeholder="Transport Rate"
          className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={transportRate}
          onChange={(e) => setTransportRate(e.target.value)}
          onKeyDown={(e) => handleEnterNext(e, 3)}
        /> */}

        {/* Local Transport */}
        {/* <input
          ref={(el) => (inputRefs.current[4] = el)}
          type="number"
          placeholder="Local Transport"
          className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={localTransport}
          onChange={(e) => setLocalTransport(e.target.value)}
          onKeyDown={(e) => handleEnterNext(e, 4)}
        /> */}

        {/* Packaging */}
        <div className="flex flex-col">
          <label>Packaging price</label>
          <input
            ref={(el) => (inputRefs.current[3] = el)}
            type="number"
            placeholder="Packaging Cost"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={packagingCost}
            onChange={(e) => setPackagingCost(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 3)}
          />
        </div>

        {/* Value */}
        {/* <input
          type="text"
          placeholder="Value"
          readOnly
          className="border p-2 rounded-lg bg-gray-100 text-gray-700"
          value={value}
        /> */}

        {/* HSN Code */}
        <div className="flex flex-col">
          <label>HSN Number</label>
          <input
            ref={(el) => (inputRefs.current[4] = el)}
            type="text"
            placeholder="HSN Code"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 4)}
          />
        </div>

        {/* GST */}
        <div className="flex flex-col">
          <label>GST %</label>
          <input
            ref={(el) => (inputRefs.current[5] = el)}
            type="number"
            placeholder="GST %"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 5)}
          />
        </div>

        {/* No. of Products Selected */}
        <div className="flex flex-col">
          <label>selected Number of Item</label>
          <input
            type="text"
            readOnly
            className="border p-2 rounded-lg bg-gray-100 "
            value={`${selectedCount} selected`}
          />
        </div>

        {/* Custom Qty */}
        <div className="flex flex-col">
          <label>Custome Quantity</label>
          <input
            ref={(el) => (inputRefs.current[6] = el)}
            type="number"
            placeholder="Custom Qty"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 6)}
          />
        </div>

        {/* 30% Margin */}
        <div className="flex flex-col">
          <label>30% Margin</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={margin30}
            placeholder="5KG 30% Margin"
          />
        </div>

        {/* 25% Margin */}
        <div className="flex flex-col">
          <label>25% Margin</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={margin25}
            placeholder="10KG 25% Margin"
          />
        </div>

        <div className="flex flex-col">
          <label>Sales rate</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={Number(customSaleRate) + Number(packagingCost)}
            placeholder="Sales rates"
          />
        </div>
      </div>

      {/* Product Rows */}
      <div className="mt-6">
        {productRows.map((row, rowIndex) => {
          const filteredProducts = products.filter((p) =>
            p.product_name
              ?.toLowerCase()
              .includes(row.productSearch.toLowerCase())
          );

          return (
            <div
              key={row.id}
              className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-lg shadow-sm mb-2 relative"
            >
              {/* Product Search Input */}
              <div className="relative flex-1">
                <label>select product</label>
                <input
                  type="text"
                  className="border p-2 rounded-lg w-full"
                  placeholder="Search product..."
                  value={row.productSearch}
                  required
                  onChange={(e) =>
                    handleProductSearchChange(row.id, e.target.value)
                  }
                  onFocus={() =>
                    setProductRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, showDropdown: true } : r
                      )
                    )
                  }
                  onKeyDown={(e) => handleProductKeyDown(e, row.id)}
                />

                {/* Product Dropdown */}
                {row.showDropdown && (
                  <ul
                    ref={(el) => (productDropdownRefs.current[row.id] = el)}
                    className="absolute bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto w-full z-10 top-full left-0 mt-1"
                  >
                    {filteredProducts.map((product, i) => {
                      const availableQty = product.size || 0;
                      const isDisabled = availableQty <= 0;

                      return (
                        <li
                          key={product.id}
                          onClick={() =>
                            !isDisabled && handleProductSelect(row.id, product)
                          }
                          className={`px-3 py-2 cursor-pointer ${
                            i === row.dropdownIndex
                              ? "bg-blue-100 border-blue-500 border"
                              : ""
                          } ${
                            isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>{product.product_name}</span>
                            <span
                              className={`text-sm ${
                                isDisabled ? "text-red-500" : "text-green-600"
                              }`}
                            >
                              Qty: {availableQty}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex flex-col">
                <label>Aval qty</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-28 bg-gray-100 text-center"
                  value={row.availableQty}
                  placeholder="Available"
                />
              </div>
              <div className="flex flex-col">
                <label>Purchase rate</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-24 bg-gray-100 text-center"
                  value={row.rate}
                  placeholder="purchase Rate"
                />
              </div>
              <div className="flex flex-col">
                <label>Sales rate</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-24 bg-gray-100 text-center"
                  value={row.salesRate}
                  placeholder="sales Rate"
                />
              </div>
              <div className="flex flex-col">
                <label>QTY</label>
                <input
                  type="number"
                  className="border p-2 rounded-lg w-28 text-center"
                  value={row.qty}
                  min={0}
                  placeholder="Qty"
                  onChange={(e) => handleQtyChange(row.id, e.target.value)}
                />
              </div>
              <div className=" flex flex-col">
                <label></label>
                <button
                  onClick={() => handleRemoveRow(row.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        <button
          onClick={handleAddRow}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 mt-3"
        >
          ➕ Add Row
        </button>
      </div>

      {/* Submit */}
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          ✅ Submit
        </button>
      </div>
    </div>
  );
};

export default CustomProductForm;
