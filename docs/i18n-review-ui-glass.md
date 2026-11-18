# Translations: Compact Glass (Stage 1)

New or corrected entries in `lib/domTranslations.json` (French, Spanish, Kinyarwanda, Swahili). Drafted and
reviewed by Claude on 2026-11-16 and approved by the owner to ship. A native speaker may still refine any line in
place.

LanguageContext translates every text node that matches a key exactly, anywhere in the app, so keys are kept
specific; weekday and month names come from the browser (Intl).

| English | French | Spanish | Kinyarwanda | Swahili |
|---|---|---|---|---|
| Search pages and actions | Rechercher des pages et des actions | Buscar páginas y acciones | Shakisha impapuro n'ibikorwa | Tafuta kurasa na vitendo |
| No results | Aucun résultat | Sin resultados | Nta bisubizo | Hakuna matokeo |
| Payment required | Paiement requis | Pago requerido | Ubwishyu burakenewe | Malipo yanahitajika |
| Your wallet is suspended | Votre portefeuille est suspendu | Tu billetera está suspendida | Ikofi yawe yahagaritswe | Pochi yako imesimamishwa |
| Log out | Se déconnecter | Cerrar sesión | Sohoka | Toka |
| Days you mark here cannot be booked | Les jours marqués ici ne peuvent pas être réservés | Los días que marques aquí no se pueden reservar | Iminsi ushyizeho akamenyetso hano ntishobora gufatirwaho umwanya | Siku unazoweka alama hapa haziwezi kuwekewa nafasi |
| Unavailable today | Indisponible aujourd'hui | No disponible hoy | Ntabwo mboneka uyu munsi | Sipatikani leo |
| Available today | Disponible aujourd'hui | Disponible hoy | Ndaboneka uyu munsi | Ninapatikana leo |
| Unavailable | Indisponible | No disponible | Ntibihari | Haipatikani |
| Wallet balance | Solde du portefeuille | Saldo de la billetera | Amafaranga ari mu ikofi | Salio la pochi |
| Turn on desktop alerts | Activer les alertes sur l'ordinateur | Activar alertas en el escritorio | Fungura imenyesha kuri mudasobwa | Washa arifa kwenye kompyuta |
| Account menu | Menu du compte | Menú de la cuenta | Menyu ya konti | Menyu ya akaunti |
| Sell photos | Vendre des photos | Vender fotos | Gucuruza amafoto | Uza picha |
| Jobs | Missions | Trabajos | Akazi | Kazi |
| Main navigation | Navigation principale | Navegación principal | Menyu nkuru | Menyu kuu |
| Color theme | Thème de couleur | Tema de color | Imigaragarire y'amabara | Mandhari ya rangi |
| Collapse menu | Réduire le menu | Contraer el menú | Gabanya menyu | Kunja menyu |
| View all | Voir tout | Ver todo | Reba byose | Tazama zote |
| Collapse sidebar | Réduire la barre latérale | Contraer la barra lateral | Gabanya menyu y'uruhande | Kunja menyu ya pembeni |
| Expand sidebar | Développer la barre latérale | Expandir la barra lateral | Agura menyu y'uruhande | Panua menyu ya pembeni |

Corrected in review: Kinyarwanda "amapaji" (anglicism) to "impapuro"; "Unavailable" aligned with the existing "Available" (Birahari / Ntibihari); "Main navigation" simplified in Kinyarwanda and Swahili; the existing Swahili "Tazama all" fixed to "Tazama zote"; "Collapse sidebar" and "Expand sidebar" were English in every language and are now translated.

## Stage 2 and 3 additions (reviewed by Claude, same method as Stage 1)

Home (photographer, client, coordinator): Events this month, New package, Compare goals, Host your own event, My hosted events,
Could not load your balance, Choose a period, Pending payouts, No upcoming events, Nothing in the last 30 days, Payment pending,
No change, vs previous period, Progress to goal, Not shared, We could not load this., Bookings in this period, goal sheet copy
(Save goal, Stop comparing, New goal, Edit goal, Goal name, Earnings/Pending/Clients/Rating target, Earnings targets are in USD),
chart empty state, Good night, Refunded, Searching…. The existing "Payment History" entry was corrected (it was word for word).

## Pages (Opportunities, My hosted events, matching card, payment chip)
Added 2026-11-17, drafted by Claude for fr, es, rw and sw (array order in lib/domTranslations.json: fr, es, rw, sw). They need
a native-speaker review before being called final; en is the source. Keys: the Opportunities page copy and info text, the
hosted events header and row menu, "Get matched" and "Remind me later" on the Home card, and the shared "Please wait…".
Two older entries were corrected (they were word-by-word substitutions such as "Get matched with Plus événements").

Notifications page (2026-11-17): 12 keys added (clear read, delete all, tip, bonus, review, opportunity, unread, showing, type label, empty body and the two confirmation dialogs). Same review status as above: drafted, needs native review.

## Batch 1 (2026-11-18): Clients, Inbox, Edit profile

Drafted by Claude for fr, es, rw, sw (array order fr, es, rw, sw in lib/domTranslations.json). Needs a native speaker,
in particular rw and sw. Plural pairs are separate keys (booking / bookings, unread message / unread messages); "Last seen yesterday at" is
followed by a time, "You are about to remove your" by a package name and then "tier. ...".

- Inactive
- No review
- out of 5
- No bookings yet
- Remove from favorites
- Add to favorites
- Tips and bonuses
- View bookings
- Message
- Favorite
- Last
- Spent
- No tips yet
- No review yet
- Link copied.
- Copy profile link
- Clients are added for you when they book you, buy your photos or message you. Share your profile link so new clients can find and book you.
- Client since
- Not set
- Last active
- List
- Grid
- Layout
- Add client
- Add a client
- Booked you twice or more
- Nothing pending
- Search clients
- Sort clients
- Share your profile
- will be removed from your clients. Their bookings and payments stay.
- Most recent
- Oldest first
- Most bookings
- Highest spent
- Filter booking requests
- Booking requests
- Declined
- New requests from clients show up here.
- No booking requests yet
- No booking requests match
- Your clients
- Everyone who booked you or bought your photos.
- Clients or booking requests
- Repeat clients
- Total earned from clients
- Tips received
- Filter clients
- All clients
- Fav
- Pending payments
- Last booking
- Total spent
- No clients yet
- When someone books you, buys your photos or messages you, they appear here.
- No clients match
- Try another filter or search.
- Remove this client?
- Remove client
- We could not load your clients.
- Client details
- Recent bookings
- Contact
- Bonuses
- Total tips received
- booking
- bookings
- Conversation
- Conversations
- You
- Message removed
- Sending
- Read
- Sent
- Not sent. Retry
- Conversation with
- Back to messages
- Refresh conversation
- Messages with
- This is the start of your conversation with
- Emoji
- Search contacts
- Search conversations
- Start a conversation
- Say hello
- Delete this message?
- It is removed for both of you.
- Edit message
- Delete message
- New message
- Filter conversations
- Pinned
- Unread
- unread message
- unread messages
- No messages yet
- Start a conversation and it will show up here.
- No pinned conversations
- You are all caught up
- No conversations match
- Select a conversation
- Pick a conversation on the left, or start a new one.
- We could not load your messages.
- No contacts yet
- No contacts match
- Try another name.
- People you work with show up here.
- Type a message...
- Online
- Yesterday
- Last seen today at
- Last seen yesterday at
- Last seen on
- at
- Pending approval
- Missing
- Currently
- No languages picked yet
- No entries yet
- Add a description over 50 characters to one of your entries
- Jump there
- Change cover photo
- Turn on Editing to change it
- Change profile photo
- KYC verified
- KYC under review
- KYC rejected
- KYC required
- of
- booking requests accepted
- No booking requests responded to yet
- Client reviews
- more review
- more reviews
- Completed jobs
- Acceptance
- Last login
- Member since
- Your name
- Basic information
- Preferred name *
- Your working name as clients know it. Real legal names are not required.
- e.g. Joe Photocuts
- Your sign-in email cannot be changed here.
- Working city
- The city you mostly work in. Your map area is set in Service area below.
- e.g. Kigali, Rwanda
- Specialties *
- Pick at least 2 categories that describe your work.
- Languages you speak *
- Pick every language you can comfortably work in. Clients see this on your public profile.
- English
- French
- Kinyarwanda
- Swahili
- Spanish
- Chinese
- Availability
- Set your working hours for each day of the week.
- Not available
- from
- to
- Save availability
- Featured projects
- Add project
- Show your best work with a photo, a title and a short description.
- No projects added yet
- Show your best work to attract more clients.
- Add your first project
- Upload image
- Change image
- Project title
- e.g. Wedding at Serena
- Short description
- Remove project
- Save project
- Untitled
- Work experience
- Add experience
- Add the work that shows your professional background.
- No work experience added yet
- New experience
- Remove experience
- Position or title *
- Company or organisation *
- e.g. Lead wedding photographer
- e.g. Elite Studios
- Duration
- Start year
- End year
- Present
- Over 50 characters counts towards your profile score.
- Your responsibilities, achievements and key projects
- Save experience
- Position
- View only
- you do not have the profile.edit permission. Ask an organisation owner to grant it if you need to make changes.
- Your previous changes have been restored.
- Your profile needs changes before it can be approved
- Our team reviewed your profile and found areas that need attention. Update the sections and save to resubmit.
- Complete your profile to get started
- Once your profile reaches 85%, it is submitted for review automatically.
- Your profile is under review
- You will be notified once your account is approved and you can start receiving bookings.
- profile change pending approval
- profile changes pending approval
- You changed sensitive fields. Our team reviews them and applies them once approved. Look for the Pending approval tag.
- Your profile is complete
- Complete your profile
- Nice work. Every section clients look at is filled in.
- A complete profile helps clients find you and trust your work.
- Add profile photo
- Add specialties
- Add a project
- Profile sections
- Working experience
- Delivery packages
- Experience
- Packages
- Changes are saved to your public profile.
- Turn on Editing to change your details.
- Editing
- Submit profile
- Submit changes
- Unsaved changes
- You have unsaved changes
- Discard
- Finish your profile
- Your profile is at
- Finish these sections to use the rest of the dashboard.
- What is still missing
- Basic info (name, phone, working city, profile photo)
- At least 2 specialties selected
- At least 1 spoken language selected
- At least 1 portfolio project
- At least 1 work experience with a description (50+ characters)
- Full name
- Phone number
- Profile photo
- Discard your changes?
- Your edits since you turned on Editing are removed.
- Remove this package?
- You are about to remove your
- tier. Clients will no longer see it on your profile or in the booking wizard.
- package
- Account active
- Changes needed
- Profile incomplete
- Under review
- Dismiss
- Saving…
