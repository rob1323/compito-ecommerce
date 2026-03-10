# E-Commerce Client-Server

## Architettura
Il client sviluppato è un **Thin Client**, perché la logica principale e i controlli di sicurezza sono implementati nel backend Node.js, mentre il frontend si occupa soprattutto di visualizzare i dati e inviare richieste HTTP.

## Endpoint
- `GET /api/users` -> ritorna la lista utenti con crediti
- `GET /api/products` -> ritorna il catalogo prodotti
- `POST /api/purchase` -> acquista un prodotto
- `POST /api/products` -> aggiunge un nuovo prodotto
- `PUT /api/products/:id/stock` -> modifica lo stock
- `PUT /api/users/:id/credits` -> assegna crediti bonus

## Sicurezza
Sono stati implementati controlli lato server per:
- bloccare acquisti se il prodotto è esaurito
- bloccare acquisti se l'utente ha crediti insufficienti
- restituire errori HTTP appropriati (`400` o `404`)

## Uso dell'IA
L'IA è stata usata per:
- organizzare la struttura del progetto
- progettare gli endpoint API
- supportare la scrittura del README
- velocizzare la creazione del codice frontend/backend

## Link
- Backend deployato: `https://prova-kgsx.onrender.com`
- Frontend deployato: `https://TUOUSERNAME.github.io/NOMEREPO/`