"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Eye,
  FolderTree,
  IndianRupee,
  PackagePlus,
  RefreshCw,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  getAdminDashboard,
  type AdminDashboardData,
} from "@/lib/admin-api";

const BRAND = "#c41245";
const BRAND_DARK = "#a50d39";
const TEXT = "#16191f";
const MUTED = "#747b87";
const BORDER = "#e5e7eb";

const EMPTY: AdminDashboardData = {
  generatedAt: "",
  stats: {
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
    categories: 0,
    banners: 0,
    growth: {
      products: 0,
      orders: 0,
      customers: 0,
      revenue: 0,
    },
  },
  salesOverview: [],
  orderStatus: {
    pending: 0,
    completed: 0,
    cancelled: 0,
  },
  recentOrders: [],
  lowStockProducts: [],
  status: {
    backend: "checking",
    mongodb: "checking",
    productsApi: "checking",
    categoriesApi: "checking",
    ordersApi: "checking",
    bannersApi: "checking",
  },
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const panelStyle: CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  boxShadow: "0 4px 18px rgba(22, 27, 38, 0.04)",
};

const tableHeadingStyle: CSSProperties = {
  padding: "11px 18px",
  fontSize: 11,
  fontWeight: 700,
  color: "#5f6673",
  whiteSpace: "nowrap",
};

const tableCellStyle: CSSProperties = {
  padding: "12px 18px",
  fontSize: 12,
  color: "#303640",
  borderTop: "1px solid #eceef1",
  whiteSpace: "nowrap",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getAdminDashboard();
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const today = useMemo(() => {
    const value = data.generatedAt
      ? new Date(data.generatedAt)
      : new Date();

    if (Number.isNaN(value.getTime())) {
      return "--";
    }

    return value.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [data.generatedAt]);

  const orderTotal =
    data.orderStatus.pending +
    data.orderStatus.completed +
    data.orderStatus.cancelled;

  const salesItems =
    data.salesOverview.length > 0
      ? data.salesOverview
      : Array.from({ length: 7 }, (_, index) => ({
          date: "",
          label: `Day ${index + 1}`,
          revenue: 0,
          orders: 0,
        }));

  const maxRevenue = Math.max(
    100,
    ...salesItems.map((item) => Number(item.revenue || 0)),
  );

  return (
    <main
      style={{
        width: "100%",
        paddingBottom: 32,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#111217",
              fontSize: 31,
              fontWeight: 800,
              letterSpacing: "-1px",
              lineHeight: 1.15,
            }}
          >
            Welcome to{" "}
            <span style={{ color: BRAND }}>
              HivraSoft
            </span>
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: MUTED,
            }}
          >
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              height: 42,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 15px",
              background: "#ffffff",
              border: `1px solid ${BORDER}`,
              borderRadius: 11,
              boxShadow: "0 2px 7px rgba(0,0,0,0.03)",
              fontSize: 12,
              fontWeight: 600,
              color: "#252932",
            }}
          >
            <CalendarDays
              size={16}
              color={BRAND}
            />

            Today ({today})
          </div>

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            style={{
              width: 42,
              height: 42,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: `1px solid ${BORDER}`,
              borderRadius: 11,
              background: "#ffffff",
              color: BRAND,
              cursor: refreshing
                ? "not-allowed"
                : "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: "12px 15px",
            border: "1px solid #fecaca",
            borderRadius: 10,
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* STATS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <DashboardStatCard
          title="Total Products"
          value={
            loading
              ? "..."
              : String(data.stats.products)
          }
          growth={data.stats.growth.products}
          footer="In your catalog"
          icon={<Boxes size={23} />}
          type="products"
        />

        <DashboardStatCard
          title="Total Orders"
          value={
            loading
              ? "..."
              : String(data.stats.orders)
          }
          growth={data.stats.growth.orders}
          footer="Received this month"
          icon={<ShoppingCart size={23} />}
          type="orders"
        />

        <DashboardStatCard
          title="Total Customers"
          value={
            loading
              ? "..."
              : String(data.stats.customers)
          }
          growth={data.stats.growth.customers}
          footer="Registered users"
          icon={<UsersRound size={23} />}
          type="customers"
        />

        <DashboardStatCard
          title="Total Revenue"
          value={
            loading
              ? "..."
              : money.format(data.stats.revenue)
          }
          growth={data.stats.growth.revenue}
          footer="From non-cancelled orders"
          icon={<IndianRupee size={23} />}
          type="revenue"
        />
      </section>

      {/* SALES + ORDER STATUS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            ...panelStyle,
            padding: 20,
            minWidth: 0,
          }}
        >
          <PanelHeader
            icon={
              <ChartNoAxesColumnIncreasing
                size={21}
              />
            }
            title="Sales Overview"
            subtitle="Order revenue for the last 7 days"
            action={
              <div
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#404651",
                  fontWeight: 600,
                }}
              >
                Last 7 Days
              </div>
            }
          />

          <div style={{ marginTop: 22 }}>
            <SalesChart
              items={salesItems}
              maxValue={maxRevenue}
            />
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
            padding: 20,
          }}
        >
          <PanelHeader
            icon={<OrderStatusIcon />}
            title="Order Status"
            subtitle="Distribution of orders by status"
          />

          <div
            style={{
              minHeight: 230,
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 38,
            }}
          >
            <OrderDonut
              status={data.orderStatus}
              total={orderTotal}
            />

            <div
              style={{
                width: "100%",
                maxWidth: 245,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <StatusLegend
                label="Pending"
                value={data.orderStatus.pending}
                total={orderTotal}
                color="#ffad32"
              />

              <StatusLegend
                label="Completed"
                value={data.orderStatus.completed}
                total={orderTotal}
                color="#38b879"
              />

              <StatusLegend
                label="Cancelled"
                value={data.orderStatus.cancelled}
                total={orderTotal}
                color="#d91432"
              />
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ORDERS + STOCK */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 16,
        }}
      >
        {/* RECENT ORDERS */}

        <div
          style={{
            ...panelStyle,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div style={{ padding: 20 }}>
            <PanelHeader
              icon={<ShoppingCart size={21} />}
              title="Recent Orders"
              subtitle="Latest orders placed by customers"
              action={
                <Link
                  href="/admin/orders"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 34,
                    padding: "0 15px",
                    borderRadius: 8,
                    background: BRAND,
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  View All
                </Link>
              }
            />
          </div>

          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 720,
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  background: "#f5f6f8",
                }}
              >
                <tr>
                  <th style={tableHeadingStyle}>
                    #
                  </th>

                  <th style={tableHeadingStyle}>
                    Product
                  </th>

                  <th style={tableHeadingStyle}>
                    Customer
                  </th>

                  <th style={tableHeadingStyle}>
                    Amount
                  </th>

                  <th style={tableHeadingStyle}>
                    Status
                  </th>

                  <th style={tableHeadingStyle}>
                    Date
                  </th>

                  <th
                    style={{
                      ...tableHeadingStyle,
                      textAlign: "center",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.recentOrders.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: MUTED,
                        fontSize: 12,
                      }}
                    >
                      {loading
                        ? "Loading orders..."
                        : "No orders found."}
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map(
                    (order) => (
                      <tr key={order.id}>
                        <td
                          style={{
                            ...tableCellStyle,
                            fontWeight: 700,
                          }}
                        >
                          #
                          {order.orderNumber ||
                            order.id.slice(-4)}
                        </td>

                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {order.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={order.imageUrl}
                                alt="Product"
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 9,
                                  border: `1px solid ${BORDER}`,
                                  objectFit: "cover",
                                  background: "#f7f3f1",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 9,
                                  border: `1px solid ${BORDER}`,
                                  background: "#f7f3f1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 8,
                                  color: MUTED,
                                }}
                              >
                                No Image
                              </div>
                            )}
                            {order.itemCount > 1 ? (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: BRAND,
                                }}
                              >
                                +{order.itemCount - 1}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            fontWeight: 500,
                          }}
                        >
                          {order.customer}
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            fontWeight: 600,
                          }}
                        >
                          {money.format(
                            order.amount,
                          )}
                        </td>

                        <td style={tableCellStyle}>
                          <OrderStatusBadge
                            status={order.status}
                          />
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            color: "#656c78",
                          }}
                        >
                          {formatDate(
                            order.date,
                          )}
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign: "center",
                          }}
                        >
                          <Link
                            href={`/admin/orders/${order.id}`}
                            aria-label="View order"
                            style={{
                              display:
                                "inline-flex",
                              width: 30,
                              height: 30,
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color: "#414751",
                              textDecoration:
                                "none",
                              borderRadius: 7,
                            }}
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK */}

        <div
          style={{
            ...panelStyle,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div style={{ padding: 20 }}>
            <PanelHeader
              icon={<AlertTriangle size={21} />}
              title="Low Stock Variants"
              subtitle="Color/size variants with fewer than 10 units"
              action={
                <Link
                  href="/admin/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 34,
                    padding: "0 15px",
                    borderRadius: 8,
                    background: BRAND,
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  View All
                </Link>
              }
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 650,
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  background: "#f5f6f8",
                }}
              >
                <tr>
                  <th style={tableHeadingStyle}>#</th>
                  <th style={tableHeadingStyle}>Product</th>
                  <th style={tableHeadingStyle}>Color</th>
                  <th style={tableHeadingStyle}>Size</th>
                  <th style={tableHeadingStyle}>Stock</th>
                  <th style={{ ...tableHeadingStyle, textAlign: "center" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {data.lowStockProducts
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: MUTED,
                        fontSize: 12,
                      }}
                    >
                      {loading
                        ? "Loading inventory..."
                        : "No low stock products."}
                    </td>
                  </tr>
                ) : (
                  data.lowStockProducts.map(
                    (product, index) => (
                      <tr key={product.id}>
                        <td
                          style={{
                            ...tableCellStyle,
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </td>

                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 10,
                            }}
                          >
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  product.imageUrl
                                }
                                alt={product.name}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 7,
                                  objectFit:
                                    "cover",
                                  border:
                                    "1px solid #e4e6ea",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 7,
                                  background:
                                    "#eef0f3",
                                  display:
                                    "flex",
                                  justifyContent:
                                    "center",
                                  alignItems:
                                    "center",
                                  color:
                                    "#737985",
                                }}
                              >
                                <Boxes
                                  size={15}
                                />
                              </div>
                            )}

                            <span
                              style={{
                                fontWeight: 500,
                              }}
                            >
                              {product.name}
                            </span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#515967" }}>
                            {product.color}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#303640" }}>
                            {product.size}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <StockBadge stock={product.stock} />
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign: "center",
                          }}
                        >
                          <Link
                            href={`/admin/products/${product.productId}/edit`}
                            aria-label="View product"
                            style={{
                              display:
                                "inline-flex",
                              width: 30,
                              height: 30,
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius: 7,
                              color: "#414751",
                              textDecoration:
                                "none",
                            }}
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* QUICK ACTION + SYSTEM */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            ...panelStyle,
            padding: 20,
          }}
        >
          <PanelHeader
            icon={
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                ϟ
              </span>
            }
            title="Quick Actions"
            subtitle="Common administrative actions"
          />

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            <QuickAction
              href="/admin/products/new"
              icon={<PackagePlus size={17} />}
              label="Add Product"
            />

            <QuickAction
              href="/admin/categories"
              icon={<FolderTree size={17} />}
              label="Manage Categories"
            />

            <QuickAction
              href="/admin/banners"
              icon={<Boxes size={17} />}
              label="Manage Banners"
            />

            <QuickAction
              href="/admin/orders"
              icon={<ShoppingCart size={17} />}
              label="View Orders"
            />

            <QuickAction
              href="/admin/customers"
              icon={<Users size={17} />}
              label="View Customers"
            />

            <QuickAction
              href="/admin/extra-add/discount-code"
              icon={<Tag size={17} />}
              label="Create Offer"
            />

            <QuickAction
              href="/admin/settings"
              icon={<Settings size={17} />}
              label="User Settings"
            />

            <QuickAction
              href="/admin/reviews"
              icon={
                <ChartNoAxesColumnIncreasing
                  size={17}
                />
              }
              label="View Reviews"
            />
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
            padding: 20,
          }}
        >
          <PanelHeader
            icon={
              <span
                style={{
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: BRAND,
                  color: "#ffffff",
                  borderRadius: 5,
                  fontSize: 11,
                }}
              >
                ▤
              </span>
            }
            title="System Status"
            subtitle="Live backend services status"
            action={
              <button
                type="button"
                onClick={() =>
                  void load(true)
                }
                style={{
                  height: 34,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#ffffff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  color: "#454c57",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            }
          />

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
            }}
          >
            <SystemStatus
              label="Backend"
              value={data.status.backend}
            />

            <SystemStatus
              label="Categories API"
              value={
                data.status.categoriesApi
              }
            />

            <SystemStatus
              label="MongoDB"
              value={data.status.mongodb}
            />

            <SystemStatus
              label="Orders API"
              value={data.status.ordersApi}
            />

            <SystemStatus
              label="Products API"
              value={
                data.status.productsApi
              }
            />

            <SystemStatus
              label="Banners API"
              value={
                data.status.bannersApi
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardStatCard({
  title,
  value,
  growth,
  footer,
  icon,
  type,
}: {
  title: string;
  value: string;
  growth: number;
  footer: string;
  icon: ReactNode;
  type:
    | "products"
    | "orders"
    | "customers"
    | "revenue";
}) {
  const theme = {
    products: {
      background: "#fff8fa",
      border: "#f3dce4",
      iconBackground: "#fde8ef",
      iconColor: "#d21851",
    },

    orders: {
      background: "#f7fbff",
      border: "#dcebf8",
      iconBackground: "#e3f2ff",
      iconColor: "#2588e7",
    },

    customers: {
      background: "#fbf8ff",
      border: "#eadff7",
      iconBackground: "#f0e5fc",
      iconColor: "#812fc0",
    },

    revenue: {
      background: "#f7fcf9",
      border: "#dceee5",
      iconBackground: "#def3e8",
      iconColor: "#119659",
    },
  }[type];

  const positive = growth >= 0;

  return (
    <article
      style={{
        minHeight: 120,
        boxSizing: "border-box",
        padding: 18,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        background: theme.background,
        boxShadow:
          "0 4px 15px rgba(29,34,43,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 11,
            background:
              theme.iconBackground,
            color: theme.iconColor,
          }}
        >
          {icon}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              color: "#353b46",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {title}
          </p>

          <p
            style={{
              margin: "3px 0 0",
              color: "#11141a",
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>

          <p
            style={{
              margin: "5px 0 0",
              color: positive
                ? "#059669"
                : "#dc2626",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {positive ? "↗" : "↘"}{" "}
            {positive ? "+" : ""}
            {growth}%
          </p>

          <p
            style={{
              margin: "4px 0 0",
              color: "#737a86",
              fontSize: 10,
            }}
          >
            {footer}
          </p>
        </div>
      </div>
    </article>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div
          style={{
            marginTop: 1,
            color: BRAND,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              color: "#171a20",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: "3px 0 0",
              color: "#7b828e",
              fontSize: 10,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}

function SalesChart({
  items,
  maxValue,
}: {
  items: AdminDashboardData["salesOverview"];
  maxValue: number;
}) {
  const safeMax = Math.max(maxValue, 1);

  const levels = [
    safeMax,
    safeMax * 0.75,
    safeMax * 0.5,
    safeMax * 0.25,
    0,
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          minWidth: 500,
          display: "flex",
        }}
      >
        <div
          style={{
            width: 42,
            height: 200,
            paddingBottom: 24,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 8,
            color: "#818793",
            fontSize: 9,
          }}
        >
          {levels.map((level, index) => (
            <span key={index}>
              {Math.round(level)}
            </span>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            height: 225,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {levels.map((_, index) => (
              <div
                key={index}
                style={{
                  borderTop:
                    "1px solid #eef0f2",
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 180,
              padding: "0 8px",
              boxSizing: "border-box",
            }}
          >
            {items.map((item, index) => {
              const revenue = Number(
                item.revenue || 0,
              );

              const height =
                revenue <= 0
                  ? 2
                  : Math.max(
                      5,
                      Math.round(
                        (revenue /
                          safeMax) *
                          165,
                      ),
                    );

              return (
                <div
                  key={`${item.date}-${index}`}
                  title={money.format(revenue)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: "100%",
                    display: "flex",
                    alignItems:
                      "flex-end",
                    justifyContent:
                      "center",
                  }}
                >
                  <div
                    style={{
                      height,
                      width: "55%",
                      maxWidth: 42,
                      minWidth: 10,
                      borderRadius:
                        "5px 5px 0 0",
                      background:
                        "linear-gradient(180deg, #ecafc1 0%, #f7d9e1 100%)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "11px 8px 0",
            }}
          >
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  fontSize: 9,
                  color: "#747b87",
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderStatusIcon() {
  return (
    <span
      style={{
        display: "block",
        position: "relative",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background:
          "conic-gradient(#c41245 0 28%, #f3cbd7 28% 100%)",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          background: "#ffffff",
        }}
      />
    </span>
  );
}

function OrderDonut({
  status,
  total,
}: {
  status: AdminDashboardData["orderStatus"];
  total: number;
}) {
  const safeTotal = Math.max(total, 1);

  const pending =
    (status.pending / safeTotal) * 100;

  const completed =
    pending +
    (status.completed / safeTotal) *
      100;

  const background =
    total === 0
      ? "conic-gradient(#e7e9ed 0 100%)"
      : `conic-gradient(
          #ffad32 0 ${pending}%,
          #38b879 ${pending}% ${completed}%,
          #d91432 ${completed}% 100%
        )`;

  return (
    <div
      style={{
        width: 145,
        height: 145,
        flexShrink: 0,
        position: "relative",
        borderRadius: "50%",
        background,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <strong
          style={{
            color: "#1a1e25",
            fontSize: 22,
          }}
        >
          {total}
        </strong>

        <span
          style={{
            color: "#59616f",
            fontSize: 11,
          }}
        >
          Orders
        </span>
      </div>
    </div>
  );
}

function StatusLegend({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "12px 1fr auto",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 11,
          height: 11,
          display: "block",
          borderRadius: "50%",
          background: color,
        }}
      />

      <span style={{ color: "#515967" }}>
        {label}
      </span>

      <span
        style={{
          color: "#303640",
          fontWeight: 500,
        }}
      >
        {value} ({percentage}%)
      </span>
    </div>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();
  const completed = ["delivered", "completed"].includes(normalized);
  const cancelled = ["cancelled", "canceled", "returned", "refunded"].includes(normalized);

  const background = completed ? "#d1fae5" : cancelled ? "#fee2e2" : "#fef3c7";
  const color = completed ? "#047857" : cancelled ? "#b91c1c" : "#b45309";
  const label = completed ? "Completed" : cancelled ? "Cancelled" : "Pending";

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 9px",
        borderRadius: 6,
        background,
        color,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function StockBadge({
  stock,
}: {
  stock: number;
}) {
  let background = "#d1fae5";
  let color = "#047857";

  if (stock <= 2) {
    background = "#fee2e2";
    color = "#dc2626";
  } else if (stock < 10) {
    background = "#fef3c7";
    color = "#b45309";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        justifyContent: "center",
        minWidth: 28,
        padding: "4px 8px",
        borderRadius: 6,
        background,
        color,
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {stock}
    </span>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        minHeight: 44,
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        border: `1px solid ${BORDER}`,
        borderRadius: 9,
        background: "#ffffff",
        color: "#303640",
        fontSize: 10,
        fontWeight: 600,
        textDecoration: "none",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          color: BRAND,
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}

function SystemStatus({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const normalized = String(
    value || "",
  ).toLowerCase();

  const ready = [
    "connected",
    "ready",
    "configured",
    "online",
    "ok",
  ].includes(normalized);

  return (
    <div
      style={{
        minHeight: 39,
        padding: "0 11px",
        border: "1px solid #eceef1",
        borderRadius: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        fontSize: 10,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#434a56",
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: ready
              ? "#059669"
              : "#f59e0b",
          }}
        />

        {label}
      </span>

      <span
        style={{
          fontWeight: 600,
          color: ready
            ? "#059669"
            : "#d97706",
          textTransform: "capitalize",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}