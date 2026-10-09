import { Routes, Route } from 'react-router-dom';
import { Header, Footer, CartDrawer, Floaters, ScrollToTop } from './components/Layout';
import { EnquiryModal } from './components/Common';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart, { OrderSuccess } from './pages/Cart';
import Checkout from './pages/Checkout';
import Account, { TrackOrder } from './pages/Account';
import Quiz from './pages/Quiz';
import Blog, { BlogPost } from './pages/Blog';
import { AboutUs, Sourcing, AboutTea, FAQ, Contact, Wholesale, Gifting, Events, Returns, Privacy, Terms, NotFound } from './pages/Info';
import Admin from './admin/Admin';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/trending" element={<Shop />} />
          <Route path="/signature" element={<Shop />} />
          <Route path="/best-selling" element={<Shop />} />
          <Route path="/offers" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderNo" element={<OrderSuccess />} />
          <Route path="/account" element={<Account />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/what-tea-is-best-for-me" element={<Quiz />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/sourcing" element={<Sourcing />} />
          <Route path="/about-tea" element={<AboutTea />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/gifting" element={<Gifting />} />
          <Route path="/events" element={<Events />} />
          <Route path="/return-refund" element={<Returns />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <EnquiryModal />
      <Floaters />
    </>
  );
}
