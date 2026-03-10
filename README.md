# NovaShop - E-Commerce Client/Server

## Architettura
Il progetto usa un modello **Thin Client**:
- il frontend gestisce interfaccia e richieste HTTP
- il backend contiene logica applicativa, autenticazione e controlli di sicurezza

## Endpoint principali

### Auth
- `POST /api/auth/register` -> registra un nuovo utente
- `POST /api/auth/login` -> login utente/admin
- `POST /api/auth/logout` -> logout
- `GET /api/auth/me` -> dati dell'utente autenticato

### User
- `GET /api/products` -> catalogo prodotti
- `POST /api/purchase` -> acquisto prodotto autenticato

### Admin
- `GET /api/admin/users` -> elenco utenti
- `POST /api/products` -> aggiunge un nuovo prodotto
- `PUT /api/products/:id` -> modifica nome/prezzo/stock/descrizione
- `PUT /api/users/:id/credits` -> assegna crediti bonus

## Sicurezza
Sono stati implementati:
- autenticazione tramite token
- protezione dell'area admin con controllo ruolo
- validazione input lato server
- blocco acquisti con stock esaurito
- blocco acquisti con crediti insufficienti
- blocco email duplicate in registrazione
- password salvate con hash
- rate limiting
- header di sicurezza con Helmet
- controllo CORS

## Dati
Nel livello base/medium i dati sono salvati su file JSON:
- `users.json`
- `products.json`

## Uso dell'IA
L'IA è stata utilizzata per:
- progettare l'architettura
- migliorare la UI
- rafforzare la sicurezza del backend
- controllare la logica di autenticazione e autorizzazione
- scrivere la documentazione tecnica

## Credenziali demo
- Admin: `admin@shop.it` / `admin123`
- User: `mario@mail.it` / `mario123`

## Link
- Backend: `https://compito-ecommerce.onrender.com`
- Frontend: `https://rob1323.github.io/NOMEREPO/`