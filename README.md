<div align="center">

# ANKRITA

### Healthy · Homemade · Freshly baked

*A warm, animated website for a home bakery run by head chef **Anu**: cakes, breads, muffins, brownies and tiramisu, baked in small batches. Café coming soon.*

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No build step](https://img.shields.io/badge/build%20step-none-fdb3ee?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/dependencies-0-c13a9f?style=for-the-badge)

</div>

---

## ✨ At a glance

ANKRITA is a complete bakery website built with **only three code files** and an `images/` folder. There is no framework, no bundler and nothing to install. Open it, or put it on any web host, and it works.

| | |
|---|---|
| **Files** | `index.html` · `style.css` · `script.js` + `images/` |
| **Pages** | Home · Our bakes · Chef Anu · Visit · Café (coming soon) · Customise |
| **Currency** | Indian Rupees (₹) |
| **Ordering** | Cart → order form → WhatsApp or email (no payment taken) |
| **Delivery** | None. Customers arrange their own courier or pick up |

---

## 🍰 What's inside

### Storefront
- **Menu with filters:** cakes, breads, muffins, brownies and tiramisu, shown as cards with prices in ₹.
- **Shopping bag:** quantities, removal, live totals, and a "fly to bag" animation when you add something.
- **Coffee and café are kept in a "coming soon" section only.** They are not on the menu.

### Ordering, built for a home bakery
- **Order form** with a full itemised summary: item, description, quantity, unit cost, line total and the grand total.
- **Customer details:** name, phone (fixed **+91**, exactly 10 digits, numbers only), optional email, address.
- **Pick-up or own delivery** choice, with a clear note that ANKRITA doesn't deliver.
- **Date and time needed**, checked against your opening hours (closed Mondays, no past dates).
- **Use my current location** fills in the address and a Google Maps pin, with a clear message for every failure case.
- **Send either way:** a prefilled **WhatsApp** message, or a direct **email** to the owner's inbox.

### Customise page (custom orders)
- A request form for custom cakes and gifting boxes: item, description, quantity or size, date and time, pick-up choice and address.
- Sends on WhatsApp or by email, with the same checks as the order form.

### Help and feedback
- Opens as a **popup from the footer** to keep the site clean.
- Email goes straight to the owner, with WhatsApp and email-app fallbacks if sending fails.

### Always-on extras
- **Floating WhatsApp chat button** on every page.
- **Social links in the footer:** Instagram, Facebook, YouTube and Google.

---

## 🎬 Animations

Inspired by the motion on the Wix "Bakery (Warm)" template, then pushed further:

- Image **wipe-up reveals** with a slow zoom-out.
- A **3D flip** on the daily menu card that follows your scroll.
- **Sliding testimonial cards** that settle one after another.
- Parallax photos, floating stickers and a rotating badge.
- Headlines that **rise letter by letter**.
- A **pink curtain** page transition that shows the next page's name.
- Cards that tilt toward your mouse, and buttons that pull toward your cursor.
- A ticker that speeds up and skews with your scroll speed.
- An animated ANKRITA logo that draws itself.
- A **cute Customise page** with floating cupcakes, donuts, hearts and falling sprinkles.
- Confetti when an order is sent.

> Everything respects `prefers-reduced-motion`. For visitors who turn motion off, the animations are switched off.

---

## 🚀 Run it

**Quickest:** double-click `index.html`.

> ⚠️ **Opening the file directly can't send email.** Browsers treat a local file differently, and the email service refuses it. Everything else works, and the forms offer WhatsApp and "open my email app" instead.

**To test email properly**, serve the folder over http:

```bash
# any one of these, from the project folder
python -m http.server 8765
npx serve
```

Then open <http://127.0.0.1:8765>.

---

## ⚙️ Make it yours

Everything below lives in **`script.js`**, near the top.

### 1. Contact details

```js
const CONFIG = { brand: 'ANKRITA', email: 'ankrita1_1@yopmail.com', whatsapp: '911234567890' };
```

- `email`: where orders and messages arrive.
- `whatsapp`: country code plus number, **digits only** (`91` is India).

### 2. Menu and prices

Edit the `products` list. Prices are whole rupees.

```js
{ id: 'brownie', name: 'Fudgy walnut brownie', price: 110, category: 'brownies',
  image: 'brownies', description: 'Dense, fudgy and full of walnuts.', badge: 'Fudgy' }
```

- `category` must be one of `cakes`, `breads`, `muffins`, `brownies`, `tiramisu`. The filter buttons are in `index.html`.
- `image` is a file name in `images/`, without `.jpg`.
- `featuredIds` and `dailyIds` choose what appears on the home page.

### 3. Opening hours

```js
const OPEN_HOURS = { 0: [9, 16], 1: null, 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [9, 16] };
```

`0` is Sunday and `null` means closed. **Keep this in step with the hours written on the Visit page** in `index.html`.

### 4. Social links, address and copy

These are plain text in `index.html`. Search for `ankrita.bakes` (social links) and `Baker's Lane` (address).

### 5. Colours and fonts

Design tokens are at the top of `style.css`:

```css
:root { --cream: #faf5e1; --ink: #422a22; --pink: #fdb3ee; --butter: #f6dd8e; --sage: #dbe5cf; }
```

---

## ✉️ How email delivery works

There is no server. Emails are sent through **[FormSubmit](https://formsubmit.co)**, a free form-to-email service.

1. A customer submits a form → the page sends it to FormSubmit.
2. FormSubmit emails it to the address in `CONFIG.email`.
3. **One-time setup:** the very first submission triggers an **"Activate Form"** email to that address. Click the link once, and every later message is delivered.

If sending ever fails, the customer sees a friendly message with **Send on WhatsApp** and **Open my email app** buttons, so no order is lost.

### 🔒 Before you go live

- **Use a private email address.** The current address is a public `yopmail` inbox that anyone can open, and orders contain names, phone numbers and addresses. Change `CONFIG.email`, then activate the new address once.
- **Replace the placeholder details:** the WhatsApp number (`1234567890` is not a real mobile number), the Instagram, Facebook and YouTube handles, and the fictional Bengaluru address.
- **Host the site over https** (for email and for the location button to work reliably).

---

## 📁 Project structure

```
.
├── index.html     # All pages, forms, popups and footer
├── style.css      # Design tokens, layout, animations, reduced-motion rules
├── script.js      # Menu, cart, routing, forms, email, location, effects
├── images/        # Product and lifestyle photos
└── README.md
```

> A few older photos in `images/` (`coffee`, `croissant`, `cinnamon`, `baker`) aren't used on the site. They're safe to delete.

---

## 🌐 Deploying

It's a static site, so any static host works:

- **GitHub Pages:** push the folder, then enable Pages.
- **Netlify or Vercel:** drag and drop the folder.
- **Any web hosting:** upload the four items listed above.

---

## ♿ Accessibility and quality

- Semantic HTML, keyboard-friendly navigation and visible focus states.
- A skip link, labelled forms, and live status messages for form results.
- Popups close with **Esc**, a click outside, or the close button, and return focus to where you were.
- Responsive from 320px phones to large desktops.
- Honeypot field to quietly drop spam submissions.

---

## 📸 Credits

- **Photos:** from [Unsplash](https://unsplash.com). Please check each photo's licence and swap in your own bakes before launch. Real photos always sell better.
- **Fonts:** [Fraunces](https://fonts.google.com/specimen/Fraunces) and [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts.
- **Motion inspiration:** the Wix "Bakery (Warm)" template. No Wix code or assets are used.
- **Brand, copy and design:** created for ANKRITA, with head chef **Anu**.

---

<div align="center">

**Baked fresh, made with love.** 🧁

</div>
