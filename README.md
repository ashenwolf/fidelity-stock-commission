# Currency Exchange Monitor

A lightweight SPA for monitoring USD to EUR exchange rates and calculating the delta from your stock sale, accounting for broker commission.

## Features

- **Real-time Exchange Rates**: Uses exchangerate-api.com for current USD/EUR rates
- **Historical Tracking**: Shows delta changes from your sale date
- **Commission Calculation**: Accounts for 2% broker commission on currency exchange
- **Persistent Settings**: Saves your sale date and amount in browser local storage
- **Visual Charts**: Interactive chart showing delta history over time
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. Open `index.html` in your web browser
2. Set your **Sale Date** (when you sold the stocks)
3. Enter your **USD Amount** (total amount from stock sale)
4. Click **Update Settings**

The application will:
- Calculate the original EUR value at the sale date rate
- Show current EUR value after 2% commission
- Display the delta (profit/loss) from the original sale
- Generate a chart showing how the delta has changed over time

## Understanding the Display

- **Current USD/EUR Rate**: Today's exchange rate
- **Delta from Sale**: How much you've gained/lost due to exchange rate changes (green = profit, red = loss)
- **Net EUR**: Current EUR amount you'd receive after 2% commission

## Technical Details

- **No Build Process**: Pure HTML/CSS/JavaScript - just open in browser
- **No Dependencies**: Uses CDN for Tailwind CSS and Chart.js
- **API**: Uses exchangerate-api.com (free tier: 1500 requests/month)
- **Storage**: Settings saved in browser localStorage
- **Updates**: Automatically refreshes data every 5 minutes

## Files

- `index.html` - Main application interface
- `app.js` - Application logic and API integration
- `README.md` - This documentation

## Browser Compatibility

Works in all modern browsers that support:
- ES6 Classes
- Fetch API
- localStorage
- Canvas (for charts)