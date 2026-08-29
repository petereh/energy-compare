# Admin Panel Guide

## 🔐 Accessing the Admin Panel

1. Navigate to: `https://your-domain.vercel.app/admin`
2. Default password: `admin123`
3. **⚠️ Change this in production!** Set `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel environment variables

## ✏️ Adding a New Energy Plan

### Step 1: Open Admin Panel
Visit `/admin` and log in

### Step 2: Fill Out Plan Details

**Required Fields:**
- **Provider Name** - Select from dropdown (Electric Ireland, SSE Airtricity, Energia, etc.)
- **Plan Name** - e.g., "Smart 24 Hour", "Energysaver 16%"
- **Fuel Type** - Electricity, Gas, or Dual Fuel
- **Standing Charge** - Daily charge in cents (e.g., `245` for €2.45/day)
- **VAT Rate** - 9% for electricity, 13.5% for gas
- **Source URL** - Link to provider's plan page

**Optional Fields:**
- **Discount %** - e.g., `16` for 16% discount
- **Exit Fee** - In euros (default: €50)
- **Contract Length** - In months (default: 12)

### Step 3: Add Plan Rates

Each plan needs at least one rate band. Click **+ Add Rate** to add more bands.

**Rate Band Fields:**
- **Band Name** - e.g., "24 Hour", "Night", "Day", "Peak", "EV"
- **Band Category** - Select from dropdown (24hr, day, night, peak, off_peak, ev, other)
- **Rate (c/kWh)** - Unit rate in cents per kWh (e.g., `31.95`)
- **Sequence** - Order of rates (1, 2, 3...)

**Example: Simple 24-Hour Plan**
```
Band Name: 24 Hour
Category: 24hr
Rate: 31.95 c/kWh
Sequence: 1
```

**Example: Day/Night Plan**
```
Band 1:
  Name: Day
  Category: day
  Rate: 34.12 c/kWh
  Sequence: 1

Band 2:
  Name: Night
  Category: night
  Rate: 16.83 c/kWh
  Sequence: 2
```

**Example: Smart Data (Peak/Day/Night)**
```
Band 1:
  Name: Night
  Category: night
  Rate: 16.91 c/kWh
  Sequence: 1

Band 2:
  Name: Day
  Category: day
  Rate: 30.75 c/kWh
  Sequence: 2

Band 3:
  Name: Peak
  Category: peak
  Rate: 34.54 c/kWh
  Sequence: 3
```

### Step 4: Submit

Click **Add Plan to Database** - the plan will be immediately available for comparison!

## ☀️ Adding Microgeneration (Solar Export) Rates

Visit `/admin/microgen` to add feed-in tariff rates for solar customers.

**What are Microgen Rates?**
These are rates that energy providers pay customers for exporting excess solar energy back to the grid. All major Irish providers offer these for customers with solar panels and smart meters.

**Required Fields:**
- **Provider Name** - Select from dropdown
- **Export Rate (c/kWh)** - Rate paid for exported energy (typically 20-30c/kWh)
- **Source URL** - Link to provider's solar/microgen page

**Optional Fields:**
- **Plan Name** - e.g., "Solar Export Plan" (if provider has specific plan name)
- **Minimum Contract** - Contract length in months (if required)
- **Smart Meter Required** - Yes/No (defaults to Yes - most common)
- **Additional Requirements** - Any special conditions (e.g., "Must have SEAI-approved installation")
- **Valid From/Until** - Date range for rate validity

**Example Entry:**
```
Provider: Electric Ireland
Export Rate: 24.00 c/kWh
Plan Name: (leave blank if no specific plan)
Smart Meter: Yes
Source URL: https://www.electricireland.ie/residential/products-services/solar-panels
```

**How It Appears:**
- Microgen rates display on the results page under each provider's plan
- Shows as a green highlighted box with solar icon ☀️
- Displays export rate, requirements, and link to provider's solar page

## 📋 Viewing All Plans

Visit `/admin/view-plans` to see all plans in the database.

**Features:**
- Filter by fuel type (All, Electricity, Gas, Dual Fuel)
- See all plan details and rates
- **Activate/Deactivate** plans (inactive plans won't appear in comparisons)
- Click **Source** to view original provider page

## 🔍 Where to Find Plan Data

### Electric Ireland
- URL: https://www.electricireland.ie/residential/electricity-and-gas/electricity-price-plans
- Look for: "Smart 24 Hour", "Energysaver", "Night Saver"
- Rates usually shown in tables or plan cards

### SSE Airtricity
- URL: https://www.sseairtricity.com/ie/home/products/switch-to-sse-airtricity
- Look for: Smart plans with 25% discounts
- Check both electricity and gas pages

### Energia
- URL: https://www.energia.ie/energy-plans/electricity
- Look for: "Smart 24 Hour", "Smart Data", "EV Smart Drive"
- Scroll through plan carousel

### Bord Gáis Energy
- URL: https://www.bordgaisenergy.ie/home/our-plans
- Use filters: Electricity/Gas, Smart/Standard meter
- Look for discount percentages

### Flogas
- URL: https://www.flogas.ie/price-plans/electricity
- Check: Electricity, Gas, Dual Fuel tabs
- Note: €300 dual fuel bonus

### Yuno Energy
- URL: https://www.yunoenergy.ie/plans
- Look for: Variable and fixed-rate plans

### PrepayPower
- URL: https://www.prepaypower.ie/why-switch/pricing
- Check: Pricing page for unit rates

## 💡 Tips

1. **Always verify rates** - Provider websites update frequently
2. **Update monthly** - Set a reminder to check for rate changes
3. **Include all rate bands** - Don't miss day/night/peak variations
4. **Check discount expiry** - Some discounts are first-year only
5. **Dual-fuel bundles** - Add separate entries for dual-fuel vs separate electricity+gas

## 🔒 Security Notes

- Admin panel is blocked from search engines (robots.txt)
- Password stored in sessionStorage (browser only)
- **Production**: Set strong password in Vercel environment variables
- **Recommended**: Add IP whitelist or proper authentication (Auth0, etc.)

## 🐛 Troubleshooting

**"Failed to add plan"**
- Check all required fields are filled
- Verify at least one rate band exists
- Check Supabase connection

**"Plan not showing in comparisons"**
- Check if plan is Active in `/admin/view-plans`
- Verify fuel_type matches user's bill

**Can't access admin panel**
- Clear browser cache/sessionStorage
- Try incognito mode
- Check if deployed to Vercel
