import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://farmconnect-hawh.onrender.com";

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================================================
   SMALL REUSABLE COMPONENTS
   ========================================================= */

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge ${String(status)
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

function DeliveryTracking({ status }) {
  const steps = [
    "Pending",
    "Accepted",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ];

  if (status === "Rejected") {
    return (
      <div className="delivery-tracking">
        <div className="tracking-rejected">
          <strong>Order Rejected</strong>
          <p>The farmer has rejected this order.</p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div className="delivery-tracking">
      {steps.map((step, index) => (
        <div className="tracking-step" key={step}>
          <div
            className={`tracking-circle ${
              index <= currentIndex ? "active" : ""
            }`}
          >
            {index < currentIndex ? "✓" : index + 1}
          </div>

          <div
            className={`tracking-label ${
              index <= currentIndex ? "active" : ""
            }`}
          >
            {step}
          </div>

          {index < steps.length - 1 && (
            <div
              className={`tracking-line ${
                index < currentIndex ? "active" : ""
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   NAVBAR
   ========================================================= */

function Navbar({
  user,
  setPage,
  handleLogout,
  fetchMyOrders,
}) {
  return (
    <nav className="navbar">
      <button
        className="logo"
        onClick={() => setPage("home")}
        type="button"
      >
        🌱 FarmConnect
      </button>

      <div className="nav-links">
        <button type="button" onClick={() => setPage("home")}>
          Home
        </button>

        <button
          type="button"
          onClick={() => setPage("marketplace")}
        >
          Marketplace
        </button>

        {user?.role === "Farmer" && (
          <button
            type="button"
            onClick={() => setPage("farmer")}
          >
            Farmer
          </button>
        )}

        {user?.role === "Retailer" && (
          <button
            type="button"
            onClick={() => setPage("retailer")}
          >
            Retailer
          </button>
        )}

        {user && (
          <button
            type="button"
            onClick={() => {
              fetchMyOrders();
              setPage("myorders");
            }}
          >
            My Orders
          </button>
        )}

        {user ? (
          <>
            <span className="user-name">👤 {user.name}</span>

            <button
              className="login-nav-btn"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="login-nav-btn"
            type="button"
            onClick={() => setPage("auth")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage({ user, setPage }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            🌱 Direct • Transparent • Local
          </div>

          <h1>
            Fresh From the
            <span> Farm, Direct to You.</span>
          </h1>

          <p>
            FarmConnect connects farmers directly with
            consumers and retailers — making fresh produce
            more accessible, transparent and fairly priced.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              type="button"
              onClick={() => setPage("marketplace")}
            >
              🛒 Explore Marketplace
            </button>

            {!user && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setPage("auth")}
              >
                🤝 Join FarmConnect
              </button>
            )}
          </div>

          <div className="hero-trust">
            <div>
              <strong>🌾</strong>
              <span>Direct from farmers</span>
            </div>
            <div>
              <strong>💰</strong>
              <span>Transparent pricing</span>
            </div>
            <div>
              <strong>🔍</strong>
              <span>Food information</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="farm-circle">🌾</div>

          <div className="floating-card floating-card-one">
            <span>🥬</span>
            <div>
              <strong>Fresh Produce</strong>
              <small>Direct from farm</small>
            </div>
          </div>

          <div className="floating-card floating-card-two">
            <span>📍</span>
            <div>
              <strong>Local Farmers</strong>
              <small>Near your location</small>
            </div>
          </div>

          <div className="floating-card floating-card-three">
            <span>✅</span>
            <div>
              <strong>Transparent</strong>
              <small>Know your food</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="section-label">WHY FARMCONNECT</span>

          <h2>
            Connecting the people who
            <span> grow food</span> with the people who buy it.
          </h2>

          <p>
            A simple marketplace designed to reduce unnecessary
            intermediaries and make agricultural trade more transparent.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🚜</div>
            <h3>Direct From Farmers</h3>
            <p>
              Farmers can list their produce directly and reach
              consumers and retailers without unnecessary layers.
            </p>
            <div className="feature-link">Farmer → Buyer</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Price Transparency</h3>
            <p>
              Buyers can see the farmer&apos;s listed price before
              placing an order.
            </p>
            <div className="feature-link">Clear pricing</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Food Transparency</h3>
            <p>
              Buyers can view farming method, pesticide information
              and harvest date declared by the farmer.
            </p>
            <div className="feature-link">Know your food</div>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading">
          <span className="section-label">HOW IT WORKS</span>

          <h2>
            From farm to your
            <span> doorstep.</span>
          </h2>

          <p>FarmConnect keeps the buying process simple.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">🌾</div>
            <h3>Farmer Lists Produce</h3>
            <p>
              Farmers add their available produce, quantity,
              price and food information.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🛒</div>
            <h3>Buyer Places Order</h3>
            <p>
              Consumers or retailers browse produce and place
              an order.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">🤝</div>
            <h3>Farmer Accepts</h3>
            <p>
              The farmer receives the order and prepares the
              requested produce.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <div className="step-icon">🚚</div>
            <h3>Delivery</h3>
            <p>
              The order moves towards the buyer until it is
              completed.
            </p>
          </div>
        </div>
      </section>

      <section className="transparency-section">
        <div className="transparency-content">
          <div className="transparency-text">
            <span className="section-label">FOOD TRANSPARENCY</span>

            <h2>
              Know more about
              <span> what you eat.</span>
            </h2>

            <p>
              FarmConnect gives buyers information declared by
              the farmer about how their produce was grown and harvested.
            </p>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setPage("marketplace")}
            >
              Explore Produce →
            </button>
          </div>

          <div className="transparency-grid">
            <div className="transparency-card">
              <span>🌱</span>
              <h3>Farming Method</h3>
              <p>
                See the farming method declared by the farmer.
              </p>
            </div>

            <div className="transparency-card">
              <span>🧪</span>
              <h3>Pesticide Information</h3>
              <p>
                Farmers can disclose pesticide usage information.
              </p>
            </div>

            <div className="transparency-card">
              <span>📅</span>
              <h3>Harvest Date</h3>
              <p>
                See when the produce was harvested.
              </p>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="cta-section">
          <div>
            <span className="section-label">GET STARTED</span>

            <h2>
              Ready to connect with
              <span> local farms?</span>
            </h2>

            <p>
              Join FarmConnect and discover a simpler way to
              buy and sell agricultural produce.
            </p>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setPage("auth")}
            >
              Create Your Account →
            </button>
          </div>
        </section>
      )}

      <footer className="footer">
        <div className="footer-brand">
          <h3>🌱 FarmConnect</h3>
          <p>Connecting farms with people.</p>
        </div>

        <div className="footer-info">
          <span>Direct Marketplace</span>
          <span>Price Transparency</span>
          <span>Food Transparency</span>
        </div>

        <div className="footer-bottom">
          © 2026 FarmConnect. Connecting Farms With People.
        </div>
      </footer>
    </>
  );
}

/* =========================================================
   AUTH PAGE
   IMPORTANT: OUTSIDE App() SO INPUT FOCUS IS NEVER LOST
   ========================================================= */

function AuthPage({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  handleLogin,
  handleSignup,
  loading,
  message,
}) {
  function updateField(field, value) {
    setAuthForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const submitHandler =
    authMode === "login" ? handleLogin : handleSignup;

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🌱</div>

          <h1>
            {authMode === "login"
              ? "Welcome Back"
              : "Join FarmConnect"}
          </h1>

          <p>
            {authMode === "login"
              ? "Login to your FarmConnect account."
              : "Create your FarmConnect account."}
          </p>
        </div>

        {message && <div className="message">{message}</div>}

        <form className="auth-form" onSubmit={submitHandler}>
          {authMode === "signup" && (
            <>
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                value={authForm.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                required
              />

              <label htmlFor="auth-location">Location</label>
              <input
                id="auth-location"
                type="text"
                value={authForm.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="e.g. Pune"
                autoComplete="address-level2"
                required
              />

              <label htmlFor="auth-role">Role</label>
              <select
                id="auth-role"
                value={authForm.role}
                onChange={(event) =>
                  updateField("role", event.target.value)
                }
              >
                <option value="Consumer">Consumer</option>
                <option value="Farmer">Farmer</option>
                <option value="Retailer">Retailer</option>
              </select>
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={authForm.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="Enter email"
            autoComplete="email"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={authForm.password}
            onChange={(event) =>
              updateField("password", event.target.value)
            }
            placeholder="Enter password"
            autoComplete={
              authMode === "login"
                ? "current-password"
                : "new-password"
            }
            required
          />

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          {authMode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FARMER PAGE
   ========================================================= */

function FarmerPage({
  user,
  message,
  produceForm,
  setProduceForm,
  handleAddProduce,
  loading,
  myProduce,
  orders,
  updateOrderStatus,
}) {
  if (!user || user.role !== "Farmer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Access Denied</h2>
          <p>Only farmers can access this page.</p>
        </div>
      </div>
    );
  }

  function updateProduceField(field, value) {
    setProduceForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">FARMER PORTAL</span>
        <h1>Farmer Dashboard 🚜</h1>
        <p>
          Welcome, {user.name}. Manage your produce and incoming
          orders.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Add Produce</h2>

          <form className="produce-form" onSubmit={handleAddProduce}>
            <label htmlFor="produce-name">Produce Name</label>
            <input
              id="produce-name"
              value={produceForm.name}
              onChange={(event) =>
                updateProduceField("name", event.target.value)
              }
              placeholder="e.g. Tomato"
              required
            />

            <label htmlFor="produce-quantity">Quantity (kg)</label>
            <input
              id="produce-quantity"
              type="number"
              min="1"
              value={produceForm.quantity}
              onChange={(event) =>
                updateProduceField("quantity", event.target.value)
              }
              required
            />

            <label htmlFor="produce-price">Price per kg (₹)</label>
            <input
              id="produce-price"
              type="number"
              min="1"
              value={produceForm.price}
              onChange={(event) =>
                updateProduceField("price", event.target.value)
              }
              required
            />

            <label htmlFor="produce-location">Location</label>
            <input
              id="produce-location"
              value={produceForm.location}
              onChange={(event) =>
                updateProduceField("location", event.target.value)
              }
              placeholder="e.g. Pune"
              required
            />

            <div className="coordinates-row">
              <div>
                <label htmlFor="produce-latitude">Latitude</label>
                <input
                  id="produce-latitude"
                  type="number"
                  step="any"
                  value={produceForm.latitude}
                  onChange={(event) =>
                    updateProduceField("latitude", event.target.value)
                  }
                  placeholder="e.g. 18.5204"
                />
              </div>

              <div>
                <label htmlFor="produce-longitude">Longitude</label>
                <input
                  id="produce-longitude"
                  type="number"
                  step="any"
                  value={produceForm.longitude}
                  onChange={(event) =>
                    updateProduceField("longitude", event.target.value)
                  }
                  placeholder="e.g. 73.8567"
                />
              </div>
            </div>

            <button
              className="secondary-btn location-btn"
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation is not supported by this browser.");
                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    updateProduceField("latitude", position.coords.latitude.toFixed(6));
                    updateProduceField("longitude", position.coords.longitude.toFixed(6));
                  },
                  () => {
                    alert("Please allow location access in your browser.");
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
              }}
            >
              📍 Use My Farm Location
            </button>

            <label htmlFor="produce-date">Harvest Date</label>
            <input
              id="produce-date"
              type="date"
              value={produceForm.harvestDate}
              onChange={(event) =>
                updateProduceField("harvestDate", event.target.value)
              }
              required
            />

            <label htmlFor="produce-method">Farming Method</label>
            <input
              id="produce-method"
              value={produceForm.farmingMethod}
              onChange={(event) =>
                updateProduceField(
                  "farmingMethod",
                  event.target.value
                )
              }
              placeholder="e.g. Conventional"
            />

            <label htmlFor="produce-pesticide">
              Pesticide Information
            </label>
            <input
              id="produce-pesticide"
              value={produceForm.pesticide}
              onChange={(event) =>
                updateProduceField(
                  "pesticide",
                  event.target.value
                )
              }
              placeholder="Enter declared information"
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Produce"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>My Listed Produce</h2>

          {myProduce.length === 0 ? (
            <div className="empty-small">
              <span>🌾</span>
              <p>No produce listed yet.</p>
            </div>
          ) : (
            <div className="mini-list">
              {myProduce.map((item) => (
                <div className="mini-item" key={item._id}>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} kg</span>
                  <span>₹{item.price}/kg</span>
                  <span>📍 {item.location}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="orders-section">
        <div className="section-heading">
          <span className="section-label">ORDERS</span>
          <h2>Incoming Orders</h2>
          <p>Accept, reject and update delivery status.</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Orders placed by buyers will appear here.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div className="order-card" key={order._id}>
                <div className="order-card-header">
                  <h3>{order.produceName}</h3>
                  <StatusBadge status={order.status} />
                </div>

                <p>
                  <strong>Buyer:</strong> {order.buyerName}
                </p>
                <p>
                  <strong>Type:</strong> {order.buyerType}
                </p>
                <p>
                  <strong>Quantity:</strong> {order.quantity} kg
                </p>
                <p>
                  <strong>Total:</strong> ₹{order.totalPrice}
                </p>
                <p>
                  <strong>Location:</strong> {order.buyerLocation}
                </p>

                <div className="order-actions">
                  {order.status === "Pending" && (
                    <>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() =>
                          updateOrderStatus(order._id, "Accepted")
                        }
                      >
                        Accept
                      </button>

                      <button
                        className="danger-btn"
                        type="button"
                        onClick={() =>
                          updateOrderStatus(order._id, "Rejected")
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === "Accepted" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(order._id, "Preparing")
                      }
                    >
                      Mark Preparing
                    </button>
                  )}

                  {order.status === "Preparing" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Out for Delivery"
                        )
                      }
                    >
                      Out for Delivery
                    </button>
                  )}

                  {order.status === "Out for Delivery" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(order._id, "Delivered")
                      }
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   MARKETPLACE
   ========================================================= */

function MarketplacePage({
  produce,
  user,
  message,
  openOrderPage,
  setPage,
}) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("");
  const [quantityFilter, setQuantityFilter] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const availableProduce = produce.filter(
    (item) => Number(item.quantity) > 0
  );

  const locations = [
    ...new Set(
      availableProduce
        .map((item) => item.location)
        .filter(Boolean)
    ),
  ];

  let filteredProduce = availableProduce.filter((item) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      item.name?.toLowerCase().includes(searchText) ||
      item.location?.toLowerCase().includes(searchText) ||
      item.farmerId?.name?.toLowerCase().includes(searchText);

    const matchesLocation =
      !location ||
      item.location?.toLowerCase() === location.toLowerCase();

    let matchesQuantity = true;

    if (quantityFilter === "small") {
      matchesQuantity = Number(item.quantity) <= 20;
    }

    if (quantityFilter === "medium") {
      matchesQuantity =
        Number(item.quantity) > 20 &&
        Number(item.quantity) <= 100;
    }

    if (quantityFilter === "bulk") {
      matchesQuantity = Number(item.quantity) > 100;
    }

    return matchesSearch && matchesLocation && matchesQuantity;
  });

  if (sort === "price-low") {
    filteredProduce.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }

  if (sort === "price-high") {
    filteredProduce.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  if (sort === "quantity-high") {
    filteredProduce.sort(
      (a, b) => Number(b.quantity) - Number(a.quantity)
    );
  }

  if (sort === "quantity-low") {
    filteredProduce.sort(
      (a, b) => Number(a.quantity) - Number(b.quantity)
    );
  }

  if (sort === "nearest" && userLocation) {
    filteredProduce = filteredProduce
      .map((item) => {
        const latitude = Number(item.latitude);
        const longitude = Number(item.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return { ...item, distanceKm: null };
        }

        return {
          ...item,
          distanceKm: calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            latitude,
            longitude
          ),
        };
      })
      .sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(coords);
        setSort("nearest");
        setLocationMessage("Your location is being used to show nearby produce.");
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLoading(false);
        setLocationMessage(
          "Location access was not allowed. You can still use the location filter."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setSort("");
    setQuantityFilter("");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">MARKETPLACE</span>
        <h1>Fresh Produce 🛒</h1>
        <p>
          Buy fresh produce directly from farmers. Search,
          compare and choose what you need.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="nearby-location-box">
        <div>
          <strong>📍 Find produce near you</strong>
          <p>Use your device location to sort produce by distance.</p>
        </div>
        <button
          className="secondary-btn location-btn"
          type="button"
          onClick={useMyLocation}
          disabled={locationLoading}
        >
          {locationLoading ? "Getting Location..." : "📍 Use My Location"}
        </button>
      </div>

      {locationMessage && (
        <div className="location-message">{locationMessage}</div>
      )}

      <div className="marketplace-filters">
        <div className="filter-search">
          <label htmlFor="market-search">🔍 Search Produce</label>
          <input
            id="market-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tomato, onion, Pune..."
          />
        </div>

        <div className="filter-item">
          <label htmlFor="market-location">📍 Location</label>
          <select
            id="market-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="quantity-filter">📦 Quantity</label>
          <select
            id="quantity-filter"
            value={quantityFilter}
            onChange={(event) => setQuantityFilter(event.target.value)}
          >
            <option value="">All quantities</option>
            <option value="small">Small — up to 20 kg</option>
            <option value="medium">Medium — 21 to 100 kg</option>
            <option value="bulk">Bulk — above 100 kg</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="market-sort">↕ Sort By</label>
          <select
            id="market-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="quantity-high">Quantity: High to Low</option>
            <option value="quantity-low">Quantity: Low to High</option>
            <option value="nearest" disabled={!userLocation}>Nearest to Me</option>
          </select>
        </div>

        <button
          className="secondary-btn clear-filter-btn"
          type="button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className="marketplace-result-bar">
        <div>
          <strong>{filteredProduce.length}</strong> produce item
          {filteredProduce.length !== 1 ? "s" : ""} found
        </div>

        {(search || location || sort || quantityFilter) && (
          <span>Filters applied</span>
        )}
      </div>

      {availableProduce.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌾</div>
          <h2>No produce available</h2>
          <p>Farmers haven&apos;t listed any produce yet.</p>
        </div>
      ) : filteredProduce.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No matching produce</h2>
          <p>Try changing your search or filters.</p>
          <button
            className="primary-btn"
            type="button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="marketplace-grid">
          {filteredProduce.map((item) => (
            <div className="produce-card" key={item._id}>
              <div className="produce-card-top">
                <div className="produce-card-icon">🌾</div>
                <span className="available-pill">
                  {item.quantity} kg available
                </span>
              </div>

              <h2>{item.name}</h2>

              <p className="produce-price">
                ₹{item.price}
                <small>/kg</small>
              </p>

              <div className="produce-meta">
                <p>
                  <strong>📍 Location:</strong> {item.location}
                </p>
                {item.distanceKm !== undefined && (
                  <p>
                    <strong>📏 Distance:</strong>{" "}
                    {item.distanceKm === null
                      ? "Location coordinates not available"
                      : `${item.distanceKm.toFixed(1)} km away`}
                  </p>
                )}
                <p>
                  <strong>📅 Harvested:</strong>{" "}
                  {item.harvestDate
                    ? new Date(item.harvestDate).toLocaleDateString("en-IN")
                    : "Not provided"}
                </p>
              </div>

              {item.farmerId && (
                <div className="transparency-box">
                  <strong>👨‍🌾 Farmer</strong>
                  <p>Name: {item.farmerId.name}</p>
                  <p>Location: {item.farmerId.location}</p>
                </div>
              )}

              <div className="transparency-box">
                <strong>🔍 Food Information</strong>
                <p>
                  Farming: {item.farmingMethod || "Not provided"}
                </p>
                <p>
                  Pesticide: {item.pesticide || "Not provided"}
                </p>
              </div>

              {user &&
                (user.role === "Consumer" || user.role === "Retailer") && (
                  <button
                    className="primary-btn full-btn"
                    type="button"
                    onClick={() => openOrderPage(item)}
                  >
                    Buy Now →
                  </button>
                )}

              {!user && (
                <button
                  className="primary-btn full-btn"
                  type="button"
                  onClick={() => setPage("auth")}
                >
                  Login to Buy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RETAILER
   ========================================================= */

function RetailerPage({
  user,
  message,
  produce,
  openOrderPage,
  setPage,
}) {
  if (!user || user.role !== "Retailer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Access Denied</h2>
          <p>Only retailers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">RETAILER PORTAL</span>
        <h1>Retailer Portal 🏪</h1>
        <p>
          Purchase agricultural produce in bulk directly from
          farmers.
        </p>
      </div>

      <div className="info-banner">
        <strong>Retailer Account</strong>
        <p>
          You can purchase produce from farmers using the
          marketplace.
        </p>
      </div>

      <MarketplacePage
        produce={produce}
        user={user}
        message={message}
        openOrderPage={openOrderPage}
        setPage={setPage}
      />
    </div>
  );
}

/* =========================================================
   ORDER PAGE
   ========================================================= */

function OrderPage({
  user,
  selectedProduce,
  buyerType,
  orderQuantity,
  setOrderQuantity,
  buyerName,
  buyerLocation,
  setBuyerLocation,
  handlePlaceOrder,
  loading,
  message,
  setPage,
}) {
  if (!selectedProduce) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>No product selected</h2>
          <p>Please choose a product from the marketplace.</p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const total =
    Number(orderQuantity || 0) *
    Number(selectedProduce.price || 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">CHECKOUT</span>
        <h1>Place Order 📦</h1>
        <p>Buy directly from the farmer.</p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="order-page-grid">
        <div className="selected-produce">
          <div className="produce-card-icon">🌾</div>

          <h2>{selectedProduce.name}</h2>

          <p className="produce-price">
            ₹{selectedProduce.price}
            <small>/kg</small>
          </p>

          <p>
            <strong>Available:</strong>{" "}
            {selectedProduce.quantity} kg
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {selectedProduce.location}
          </p>

          {selectedProduce.farmerId && (
            <div className="transparency-box">
              <strong>👨‍🌾 Farmer</strong>
              <p>
                Name: {selectedProduce.farmerId.name}
              </p>
              <p>
                Location: {selectedProduce.farmerId.location}
              </p>
            </div>
          )}

          <div className="transparency-box">
            <strong>🔍 Food Information</strong>
            <p>
              Farming:{" "}
              {selectedProduce.farmingMethod ||
                "Not provided"}
            </p>
            <p>
              Pesticide:{" "}
              {selectedProduce.pesticide ||
                "Not provided"}
            </p>
          </div>
        </div>

        <form
          className="order-form"
          onSubmit={handlePlaceOrder}
        >
          <label htmlFor="buyer-type">Buyer Type</label>
          <input
            id="buyer-type"
            value={user?.role || buyerType}
            readOnly
          />

          <label htmlFor="order-quantity">
            Quantity (kg)
          </label>
          <input
            id="order-quantity"
            type="number"
            min="1"
            max={selectedProduce.quantity}
            value={orderQuantity}
            onChange={(event) =>
              setOrderQuantity(event.target.value)
            }
            required
          />

          <label htmlFor="buyer-name">Your Name</label>
          <input
            id="buyer-name"
            value={buyerName}
            readOnly
          />

          <label htmlFor="buyer-location">
            Delivery Location
          </label>
          <input
            id="buyer-location"
            value={buyerLocation}
            onChange={(event) =>
              setBuyerLocation(event.target.value)
            }
            required
          />

          <div className="order-total">
            <span>Total Price</span>
            <strong>₹{total}</strong>
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Confirm Order"}
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   MY ORDERS
   ========================================================= */

function MyOrdersPage({
  user,
  buyerOrders,
  message,
  setPage,
}) {
  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Please Login</h2>
          <p>You need to login to view your orders.</p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("auth")}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">ORDERS</span>
        <h1>My Orders 📦</h1>
        <p>Orders connected to your FarmConnect account.</p>
      </div>

      {message && <div className="message">{message}</div>}

      {buyerOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>
            Your orders will appear here after you purchase
            produce.
          </p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {buyerOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-card-header">
                <h3>{order.produceName}</h3>
                <StatusBadge status={order.status} />
              </div>

              <p>
                <strong>Quantity:</strong> {order.quantity} kg
              </p>

              <p>
                <strong>Price:</strong> ₹
                {order.pricePerKg}/kg
              </p>

              <p>
                <strong>Total:</strong> ₹{order.totalPrice}
              </p>

              <p>
                <strong>Delivery:</strong>{" "}
                {order.buyerLocation}
              </p>

              <DeliveryTracking status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("farmconnect_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("farmconnect_token")
  );

  const [authMode, setAuthMode] = useState("login");

  const [produce, setProduce] = useState([]);
  const [myProduce, setMyProduce] = useState([]);
  const [orders, setOrders] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);

  const [selectedProduce, setSelectedProduce] =
    useState(null);

  const [buyerType, setBuyerType] =
    useState("Consumer");

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerLocation, setBuyerLocation] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    role: "Consumer",
  });

  const [produceForm, setProduceForm] = useState({
    name: "",
    quantity: "",
    price: "",
    location: "",
    harvestDate: "",
    farmingMethod: "",
    pesticide: "",
    latitude: "",
    longitude: "",
  });

  /* -------------------------------------------------------
     FETCH PRODUCE
     ------------------------------------------------------- */

  async function fetchProduce() {
    try {
      const response = await fetch(
        `${API_URL}/api/produce`
      );

      const data = await response.json();

      if (response.ok) {
        setProduce(data);
      }
    } catch (error) {
      console.error("Fetch produce error:", error);
    }
  }

  async function fetchMyProduce() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/produce/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMyProduce(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch my produce error:", error);
    }
  }

  async function fetchOrders() {
    if (!token || !user || user.role !== "Farmer") {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch farmer orders error:", error);
    }
  }

  async function fetchMyOrders() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/orders/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBuyerOrders(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch my orders error:", error);
    }
  }

  useEffect(() => {
    fetchProduce();
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    fetchMyOrders();

    if (user.role === "Farmer") {
      fetchOrders();
      fetchMyProduce();
    }
  }, [token, user]);

  /* -------------------------------------------------------
     LOGIN
     ------------------------------------------------------- */

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem(
        "farmconnect_token",
        data.token
      );

      localStorage.setItem(
        "farmconnect_user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setMessage("Login successful! 🌱");

      if (data.user.role === "Farmer") {
        setPage("farmer");
      } else if (data.user.role === "Retailer") {
        setPage("retailer");
      } else {
        setPage("marketplace");
      }

      setAuthForm({
        name: "",
        email: "",
        password: "",
        location: "",
        role: "Consumer",
      });
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     SIGNUP
     ------------------------------------------------------- */

  async function handleSignup(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed.");
        return;
      }

      localStorage.setItem(
        "farmconnect_token",
        data.token
      );

      localStorage.setItem(
        "farmconnect_user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setMessage("Account created successfully! 🌱");

      if (data.user.role === "Farmer") {
        setPage("farmer");
      } else if (data.user.role === "Retailer") {
        setPage("retailer");
      } else {
        setPage("marketplace");
      }

      setAuthForm({
        name: "",
        email: "",
        password: "",
        location: "",
        role: "Consumer",
      });
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  function handleLogout() {
    localStorage.removeItem("farmconnect_token");
    localStorage.removeItem("farmconnect_user");

    setToken(null);
    setUser(null);
    setBuyerOrders([]);
    setOrders([]);
    setMyProduce([]);
    setSelectedProduce(null);
    setPage("home");
    setMessage("Logged out successfully.");
  }

  /* -------------------------------------------------------
     ADD PRODUCE
     ------------------------------------------------------- */

  async function handleAddProduce(event) {
    event.preventDefault();

    if (!token) {
      setMessage("Please login first.");
      setPage("auth");
      return;
    }

    if (!user || user.role !== "Farmer") {
      setMessage("Only farmers can add produce.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/produce`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: produceForm.name,
            quantity: Number(produceForm.quantity),
            price: Number(produceForm.price),
            location: produceForm.location,
            harvestDate: produceForm.harvestDate,
            farmingMethod: produceForm.farmingMethod,
            pesticide: produceForm.pesticide,
            latitude: produceForm.latitude === "" ? null : Number(produceForm.latitude),
            longitude: produceForm.longitude === "" ? null : Number(produceForm.longitude),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to add produce."
        );
        return;
      }

      setMessage("Produce added successfully! 🌾");

      setProduceForm({
        name: "",
        quantity: "",
        price: "",
        location: "",
        harvestDate: "",
        farmingMethod: "",
        pesticide: "",
        latitude: "",
        longitude: "",
      });

      await fetchProduce();
      await fetchMyProduce();
    } catch (error) {
      console.error("Add produce error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     OPEN ORDER PAGE
     ------------------------------------------------------- */

  function openOrderPage(item) {
    if (!user) {
      setMessage("Please login to place an order.");
      setPage("auth");
      return;
    }

    if (
      user.role !== "Consumer" &&
      user.role !== "Retailer"
    ) {
      setMessage(
        "Only consumers and retailers can place orders."
      );
      return;
    }

    setSelectedProduce(item);
    setBuyerType(user.role);
    setOrderQuantity(1);
    setBuyerName(user.name);
    setBuyerLocation(user.location || "");
    setMessage("");
    setPage("order");
  }

  /* -------------------------------------------------------
     PLACE ORDER
     ------------------------------------------------------- */

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!token || !user) {
      setMessage("Please login first.");
      setPage("auth");
      return;
    }

    if (!selectedProduce) {
      setMessage("No produce selected.");
      return;
    }

    const quantity = Number(orderQuantity);

    if (quantity < 1) {
      setMessage("Order quantity must be at least 1 kg.");
      return;
    }

    if (quantity > Number(selectedProduce.quantity)) {
      setMessage("Requested quantity is not available.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            produceId: selectedProduce._id,
            buyerType: user.role,
            quantity,
            buyerName: user.name,
            buyerLocation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to place order."
        );
        return;
      }

      setMessage("Order placed successfully! 🎉");
      setSelectedProduce(null);

      await fetchProduce();
      await fetchMyOrders();

      setPage("myorders");
    } catch (error) {
      console.error("Place order error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     UPDATE ORDER STATUS
     ------------------------------------------------------- */

  async function updateOrderStatus(orderId, status) {
    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to update order."
        );
        return;
      }

      setMessage(`Order status updated to "${status}".`);

      await fetchOrders();
      await fetchMyOrders();
    } catch (error) {
      console.error("Update order error:", error);
      setMessage("Unable to connect to server.");
    }
  }

  /* -------------------------------------------------------
     ROUTER
     ------------------------------------------------------- */

  function renderPage() {
    switch (page) {
      case "home":
        return (
          <HomePage
            user={user}
            setPage={setPage}
          />
        );

      case "auth":
        return (
          <AuthPage
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            handleLogin={handleLogin}
            handleSignup={handleSignup}
            loading={loading}
            message={message}
          />
        );

      case "farmer":
        return (
          <FarmerPage
            user={user}
            message={message}
            produceForm={produceForm}
            setProduceForm={setProduceForm}
            handleAddProduce={handleAddProduce}
            loading={loading}
            myProduce={myProduce}
            orders={orders}
            updateOrderStatus={updateOrderStatus}
          />
        );

      case "marketplace":
        return (
          <MarketplacePage
            produce={produce}
            user={user}
            message={message}
            openOrderPage={openOrderPage}
            setPage={setPage}
          />
        );

      case "retailer":
        return (
          <RetailerPage
            user={user}
            message={message}
            produce={produce}
            openOrderPage={openOrderPage}
            setPage={setPage}
          />
        );

      case "order":
        return (
          <OrderPage
            user={user}
            selectedProduce={selectedProduce}
            buyerType={buyerType}
            orderQuantity={orderQuantity}
            setOrderQuantity={setOrderQuantity}
            buyerName={buyerName}
            buyerLocation={buyerLocation}
            setBuyerLocation={setBuyerLocation}
            handlePlaceOrder={handlePlaceOrder}
            loading={loading}
            message={message}
            setPage={setPage}
          />
        );

      case "myorders":
        return (
          <MyOrdersPage
            user={user}
            buyerOrders={buyerOrders}
            message={message}
            setPage={setPage}
          />
        );

      default:
        return (
          <HomePage
            user={user}
            setPage={setPage}
          />
        );
    }
  }

  return (
    <>
      <Navbar
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
        fetchMyOrders={fetchMyOrders}
      />

      {renderPage()}
    </>
  );
}

export default App;
