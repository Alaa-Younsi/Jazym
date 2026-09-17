import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { TrackingProvider } from "@/components/TrackingProvider";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { PageLoader } from "@/components/ui/Spinner";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/theme/ThemeProvider";

const Landing = lazy(() => import("@/pages/Landing"));
const Shop = lazy(() => import("@/pages/Shop"));
const Product = lazy(() => import("@/pages/Product"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const Policy = lazy(() => import("@/pages/Policy"));
const Contact = lazy(() => import("@/pages/Contact"));
const LandingPageView = lazy(() => import("@/pages/LandingPageView"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderNew = lazy(() => import("@/pages/admin/OrderNew"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminDelivery = lazy(() => import("@/pages/admin/DeliveryPrices"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminLandingPages = lazy(() => import("@/pages/admin/LandingPages"));
const AdminLandingForm = lazy(() => import("@/pages/admin/LandingPageForm"));
const AdminPixels = lazy(() => import("@/pages/admin/Pixels"));
const AdminPanels = lazy(() => import("@/pages/admin/Panels"));
const AdminPanelForm = lazy(() => import("@/pages/admin/PanelForm"));
const AdminTeam = lazy(() => import("@/pages/admin/Team"));
const AdminAccount = lazy(() => import("@/pages/admin/Account"));
const AdminPolicy = lazy(() => import("@/pages/admin/Policy"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/boutique" element={<Shop />} />
            <Route path="/boutique/:categorySlug" element={<Shop />} />
            <Route path="/produit/:slug" element={<Product />} />
            <Route path="/commander" element={<Checkout />} />
            <Route path="/commande/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/politique" element={<Policy />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route path="/lp/:slug" element={<LandingPageView />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/new" element={<AdminOrderNew />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="delivery" element={<AdminDelivery />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="landing" element={<AdminLandingPages />} />
            <Route path="landing/:id" element={<AdminLandingForm />} />
            <Route path="pixels" element={<AdminPixels />} />
            <Route path="panels" element={<AdminPanels />} />
            <Route path="panels/:id" element={<AdminPanelForm />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="account" element={<AdminAccount />} />
            <Route path="policy" element={<AdminPolicy />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <TrackingProvider>
                <RouteErrorBoundary>
                  <AppRoutes />
                </RouteErrorBoundary>
              </TrackingProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
