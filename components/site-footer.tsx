import Link from 'next/link';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { href: '/shop', label: 'All Products' },
    { href: '/categories/electronics', label: 'Electronics' },
    { href: '/categories/audio', label: 'Audio' },
    { href: '/categories/wearables', label: 'Wearables' },
  ],
  Account: [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Order History' },
    { href: '/account/wishlist', label: 'Wishlist' },
    { href: '/account/addresses', label: 'Addresses' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/shop', label: 'Careers' },
    { href: '/shop', label: 'Press' },
  ],
  Support: [
    { href: '/shop', label: 'Help Center' },
    { href: '/shop', label: 'Shipping' },
    { href: '/shop', label: 'Returns' },
    { href: '/shop', label: 'Warranty' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-jakarta text-lg font-bold">Nimbus</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Modern commerce powered by an Odoo ERP backend. Quality products, fast shipping,
              seamless experience.
            </p>
            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> support@nimbus.shop
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +1 (800) 555-0140
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> San Francisco, CA
              </p>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-jakarta text-sm font-semibold">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nimbus Commerce. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
