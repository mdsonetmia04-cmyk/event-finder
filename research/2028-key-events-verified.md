# StockSeason Intelligence — Key Event Dates Research
## 2028 mega/anchor events (web-verified 2026-10-31) + 2027 reference

Purpose: verified date inputs for `src/data/events.json`. Variable religious dates are
provisional by calendar type; never present them as confirmed in the UI.

### 2028 — verified 2026-10-31

| Event | Date 2028 | Calendar type | Verification status | Notes |
|---|---|---|---|---|
| Chinese New Year (Earth Monkey) | Jan 26 (Wed) | Lunisolar (Chinese) | High | Lantern Festival Feb 9. One source (publicholidays.info China page) tentatively lists Jan 29 — outlier; Jan 26 confirmed by majority of lunisolar calculators. |
| Ramadan begins | ~Jan 28 (Fri) | Lunar (Islamic, 1449H) | Provisional — moon sighting ±1–2 days | AnyCalendar/CalendarZ/time.now agree. |
| Eid al-Fitr | ~Feb 27 (Sun) | Lunar (1 Shawwal 1449H) | Provisional — moon sighting | Matches timeanddate.de USA calendar. |
| Valentine's Day | Feb 14 | Fixed | High | — |
| St. Patrick's Day | Mar 17 | Fixed | High | — |
| Easter Sunday | Apr 16 | Computus (Western) | High — deterministic | Good Friday Apr 14, Easter Monday Apr 17. Orthodox Easter differs. |
| Passover (1st day) | Apr 11 | Lunisolar (Hebrew) | Medium — verify against Hebrew calendar source before publishing | From timeanddate.de USA calendar extract. |
| Mother's Day (US) | May 14 | Fixed rule (2nd Sun May) | High | — |
| Eid al-Adha | ~May 5 (Fri) | Lunar (10 Dhu al-Hijjah 1449H) | Provisional — moon sighting | AnyCalendar + time.now agree; cute-calendar says May 5–8 window. |
| Father's Day (US) | Jun 18 | Fixed rule (3rd Sun Jun) | High | — |
| Independence Day (US) | Jul 4 | Fixed | High | — |
| Halloween | Oct 31 | Fixed | High | — |
| Diwali / Lakshmi Puja (India) | Oct 17 (Tue) | Lunar (Kartika Amavasya) | High for India; regional ±1 day | Lagna360 + AstroSage + interfaith calendar (Amavasya Oct 17 12:05 PM – Oct 18 8:25 AM IST). |
| Thanksgiving (US) | Nov 23 | Fixed rule (4th Thu Nov) | High | — |
| Black Friday | Nov 24 | Derived from Thanksgiving | High | — |
| Cyber Monday | Nov 27 | Derived (Mon after Thanksgiving) | High | — |
| Hanukkah (Chanukah) | Dec 12–20 | Lunisolar (Hebrew, 25 Kislev) | High — confirmed by Chabad.org | Begins nightfall Dec 12. |
| Christmas | Dec 25 | Fixed | High | — |

### 2027 — verified 2026-10-31 (from Seasonal Calendar 2027 Premium deck research)

| Event | Date 2027 | Status |
|---|---|---|
| Lunar New Year | Feb 6 (Sat) | High |
| Valentine's Day | Feb 14 | High |
| Ramadan begins | ~Feb 8 | Provisional |
| Eid al-Fitr | ~Mar 9–10 | Provisional |
| St. Patrick's Day | Mar 17 | High |
| Easter Sunday | Mar 28 | High |
| Mother's Day (US) | May 9 | High |
| Eid al-Adha | ~May 17 | Provisional |
| Father's Day (US) | Jun 20 | High |
| Independence Day (US) | Jul 4 | High |
| Halloween | Oct 31 | High |
| Diwali | Oct 29 | Provisional (regional) |
| Thanksgiving (US) | Nov 25 | High |
| Black Friday | Nov 26 | High |
| Christmas | Dec 25 | High |

### Source URLs (retrieved 2026-10-31, use as research-notes references)

- https://www.calendardate.com/easter_2028.htm
- https://calendarhours.com/federal-holidays-2028/
- https://make-a-calendar.com/holidays/2028
- https://www.thepsychicline.com/psychic-blog/chinese-new-year-2028
- https://studycli.org/chinese-holidays/2028/
- https://www.calendardate.com/chinese_new_year_2028.htm
- https://anycalendar.org/ramadan-calendar/2028
- https://time.now/islamic-calendar/key-dates/1449/
- https://www.calendarz.com/amp/when-is/muslim-holidays/ramadan/2028
- https://www.lagna360.com/festivals/diwali/2028
- https://panchang.astrosage.com/calendars/indiancalendar?date=2028&language=en&view=amp
- https://ucms01mstrl7b6dprod.dxcloud.episerver.net/globalassets/diversity-and--inclusion-office/documents/interfaith-calendar-2024-2028.pdf
- https://www.chabad.org/holidays/chanukah/article_cdo/aid/671899/jewish/When-Is-Hanukkah-Chanukah-Celebrated-in-2026-2027-2028-2029-and-2030.htm
- https://calculat.io/en/date/when-is/hanukkah--2028

### Guidance for the events DB

- Store `verificationStatus` per event: `confirmed` (fixed/rule-based/deterministic),
  `provisional` (lunar, moon-sighting dependent). UI must show provisional badge on the latter.
- Do NOT claim Adobe Stock sales data. Priority scores stay internal planning indicators.
- Country-specific variants still needed (e.g. Thanksgiving Canada Oct 12; Mother's Day UK Mar 14 2027) — dates above are US/global anchors only.
