# Progetto di Programmazione Avanzata 2022
L'applicazione permette agli utenti registrati di richiedere job per la previsione di punti di traiettorie di navi da pesca.

- Davide Olivieri
- Lorenzo D'Agostino
- Antonio Lanciotti

Il lavoro è stato svolto per la maggior parte in presenza e pertanto ognuno di noi ha seguito l'intero sviluppo del progetto.
Abbiamo sfruttato l'estensione di VS Code "Live Share" per la condivisione in tempo reale dell'ambiente di lavoro.
Tutto lo sviluppo è stato comunque costantemente riportato sul repository GitHub, sfruttando anche le funzionalità di branch, come visibile dallo storico dei commits.

## Use Case
Per mezzo del diagramma "Use Case" sono stati modellati i requisiti richiesti nelle specifiche del progetto. 

Nel lato sinistro del diagramma ci sono i due attori attivi rappresentati dallo **User** e dall'**Admin** (estensione dello User). Essi hanno accesso a sei rotte ognuna per effettuare una richiesta diversa:

* **jobHistory** : per richiedere lo storico delle richieste, eventualmente filtrate su un intervallo di tempo e calcolarne le statistiche
* **newJobsRequest** : per richiedere un job di previsione di una traiettoria
* **jobStatus** : per richiedere lo stato attuale del processamento del job
* **resultRequest** : per chiedere il risultato della previsione
* **creditAvaiable** : per richiedere il credito attualmente disponibile
* **creditCharge** : per richiedere di ricaricare i crediti (operazione effettuabile esclusivamente da un Admin).

E' da tener presente che ogni richiesta di previsione, costerà allo User un numero di crediti pari al numero di punti da predire moltiplicato per un fattore *k = 0.05* fino a 100 punti, dopodichè il fattore sarà di 0.06. 

Queste richieste interagiscono con degli attori interni, che sono: **servizio bull-redis**, il **servizio Python** e il **database MongoDB**.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/UseCase.png)

## Schema ER Database
Lo schema Entità Relazione del database progettato prevede 4 tabelle:

* **Users** : contente le informazioni di ogni utente
* **Jobs** : contenente le informazioni di un job
* **Sessions** : contenente le informazioni specifiche sulla sessione
* **Points** : punti di ogni sessione di pesca

E' visibile dalle relazioni come ogni *User* può avere più *Job*, un *Job* può contenere al massimo una sessione di pesca (*Sessions*) e quest'ultima sarà descritta da n *Points*.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/ER_Schema.png)

## MongoDB
La scelta di un database non relazionale è dettata dalla struttura dei dati a disposizione (è venuto naturale considerare la sessione come vettore di punti) quindi abbiamo aggregato la relazione di *Points* in *Sessions* la quale verrà successivamente integrata nel campo *job_info* della collezione **Jobs**. Ogni sessione è composta da una serie di campi e da un array di oggetti di tipo *Points*, e tali informazioni saranno utilizzate dal *Job*.
E' da sottolineare che al job è stato assegnato un concetto più generico, ovvero non rappresenta esclusivamente il concetto di sessione di pesca, ma un qualsiasi tipo di task, che dovrà essere specificato nel campo *job_info*. 
Rimane inalterata la relazione tra **Jobs** e **User**, che saranno le due collezioni che comporanno il nostro database, connesse tramite il campo *user_id* del *Job*.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/MongoDB.png)

## UML
 Prima di andare a strutturare il backend *Node, Express, TS* abbiamo definito delle interfacce e dei modelli del nostro sistema di dati: per ogni tabella presentata nello schema ER è stata creata un'interfaccia che ci permette di generalizzare le concretizzazioni degli oggetti, e uno *schema* (relativo all'ODM *Mongoose* utilizzato per l'interfacciamento con il DB Mongo) per le due collezioni sopra descritte.
In definitiva abbiamo implementato 5 interfacce per la rappresentazione dei dati:
* **IUser**
* **IJob**
* **ISession**
* **IPoint**
* **IMongoEntity** (contenente solo il campo ObjectID per modellare oggetti presenti nel DB Mongo)

Lo stato del job (*status*) e il ruolo dell'utente (*role*) sono stati modellati come *enum*. 

L'archittettura è stata generalizzata per prevedere più tipi di job, questa generalizzazione permetterebbe la creazione di job diversi dal nostro. Nel nostro caso il campo *job_info* sarà sempre un oggetto di tipo *ISession*. 
 
I dati sono conservati all'interno di un database e vengono gestiti utilizzando la libreria *mongoose* la quale espone i metodi CRUD per l'accesso alle collezioni, rappresenta pertanto intrinsicamente un pattern **DAO** separando la logica di business dalla logica di accesso ai dati.
La libreria viene incapsulata all'interno di un **Repository**, che verrà utilizzato dal **Service** per accedere ai dati in maniera astratta rispetto all'implementazione proposta da *mongoose*.

Il **Dispatcher** incapsula la logica di **Bull** e implementa due metodi, uno per aggiungere i processi nella coda e l'altro che accetta un **IJobEventsListener** che contiene le callback da lanciare ad ogni cambio di stato dei processi. Il dispatcher richiede l'*injection* di un oggetto con interfaccia **IProcessor**, nel nostro caso concretizzata dalla classe **SessionJobProcessor**, la quale espone i metodi necessari a validare il job inviato dall'utente tramite la richiesta, calcolarne il prezzo e implementare il processamento del job, che nel nostro caso va ad interrogare il servizio **Python** e a ritornare i risultati ottenuti.

Il cuore dell'applicazione è il **Service**, pensato come singleton, dove vengono implementati tutti quei metodi che andranno a soddisfare le richeste dell'utente finale. Esso implementa anche i metodi dell'interfaccia **IJobEventsListener**  responsabile di gestire i cambi di stato dei processi nella coda aggiornando il DB.

La gestione delle rotte, non visibile nel diagramma, è stata implementata utilizzando la classe *Router* della libreria *express*, andando a risolvere le richieste attraverso il *Service*.
Le rotte fanno utilizzo del pattern **Middleware** per gestire l'autenticazione degli utenti tramite token JWT.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/Class_Diagram.png)

## Pattern Utilizzati
1) **Repository**: Per nascondere dietro un layer di astrazione l'implementazione delle operazioni di persistenza dati dal database (MongoDB) attraverso la libreria *mongoose*.
2) **Singleton**: Utilizzato per la classe **Service** con lo scopo di garantire che ne venga creata una e una sola istanza con un punto di accesso globale.
3) **Observer**: Il **Dispatcher**, incapsulando la logica di Bull, è l'*Observable* che invia le notifiche sui cambi di stato attraverso delle callback. Tali callback sono definite nell'interfaccia **IJobEventsListener** e nel nostro caso implementate dal **Service** che svolge pertanto il ruolo di *Observer*.
4) **Middleware**: Permette, all'interno delle rotte, di gestire l'autenticazione degli utenti tramite token JWT.

## Documentazione tecnica
L'applicazione è avviabile nella sua interezza attraverso il comando *docker-compose up* da lanciare nella root del progetto.
Nella versione di sviluppo vengono avviati i seguenti servizi:
* Redis (porta 6379)
* Redis Commander (porta 8081)
* MongoDB (porta 27017)
* Mongo Express (porta 8082)
* Python (porta 5001)
* **Node** (porta 3000)

Le rotte implementate richiedono un?autenticazione attraverso token JWT, si possono utilizzare quelli contenuti nel file *utils/token.json*.

Come esempio di job da inserire nel body della richiesta "newJob", si può usare quello di prova presente nel file *utils/newjob.json*.

Tutte le rotte sono state testate attraverso l'estensione di VS Code *Thunder Client* (applicativo analogo a Postman), le richieste utilizzate sono importabili dalla cartella *thunder-tests* e ne riportiamo di seguito i risultati:

| Method | Name                                 | Url                                                                                              | Status | Time  |
|--------|--------------------------------------|--------------------------------------------------------------------------------------------------|--------|-------|
| GET    | Base Test                            | http://localhost:3000                                                                            | 200    | 3 ms  |
| GET    | Auth Test                            | http://localhost:3000/api                                                                        | 200    | 6 ms  |
| POST   | New Job                              | http://localhost:3000/api/newJob                                                                 | 200    | 18 ms |
| GET    | Job Status                           | http://localhost:3000/api/getJobStatus/62a86a015b47a2244de5b2b5                                  | 200    | 9 ms  |
| GET    | Job Info                             | http://localhost:3000/api/getJobInfo/62a86a015b47a2244de5b2b5                                    | 200    | 9 ms  |
| GET    | History                              | http://localhost:3000/api/getHistory                                                             | 200    | 38 ms |
| GET    | History \(with time params\)         | http://localhost:3000/api/getHistory?t\_min=2022\-06\-14T13:24:36Z&t\_max=2022\-06\-14T14:24:36Z | 200    | 36 ms |
| GET    | Check User Credit                    | http://localhost:3000/api/getUserCredit                                                          | 200    | 8 ms  |
| GET    | Check User Credit Copy               | http://localhost:3000/api/getUserCredit                                                          | 200    | 11 ms |
| GET    | Charge Credit                        | http://localhost:3000/api/chargeCredit?user\_email=lorenzodag@example\.com&amount=10             | 200    | 12 ms |
| GET    | Auth Test \(NO AUTH\)                | http://localhost:3000/api                                                                        | 403    | 2 ms  |
| GET    | Auth Test \(EMPTY AUTH\)             | http://localhost:3000/api                                                                        | 403    | 5 ms  |
| GET    | Auth Test \(INVALID TOKEN\)          | http://localhost:3000/api                                                                        | 403    | 2 ms  |
| GET    | Auth Test \(WRONG JWT KEY\)          | http://localhost:3000/api                                                                        | 403    | 4 ms  |
| GET    | Auth Test \(USER NOT FOUND\)         | http://localhost:3000/api                                                                        | 403    | 7 ms  |
| GET    | Job Status \(INVALID ID\)            | http://localhost:3000/api/getJobStatus/62a86a015b474de5b2b5                                      | 400    | 6 ms  |
| GET    | Job Info \(INVALID ID\)              | http://localhost:3000/api/getJobInfo/62a86a015b474de5b2b5                                        | 400    | 5 ms  |
| GET    | History \(USER W/O JOBS\)            | http://localhost:3000/api/getHistory                                                             | 200    | 7 ms  |
| GET    | Charge Credit \(NO ADMIN\)           | http://localhost:3000/api/chargeCredit?user\_email=lorenzodag@example\.com&amount=1              | 403    | 9 ms  |
| GET    | Charge Credit \(MISSING QUERY\)      | http://localhost:3000/api/chargeCredit                                                           | 400    | 5 ms  |
| GET    | Charge Credit \(NEGATIVE AMOUNT\)    | http://localhost:3000/api/chargeCredit?user\_email=lorenzodag@example\.com&amount=\-1            | 400    | 7 ms  |
| GET    | Charge Credit \(WRONG EMAIL\)        | http://localhost:3000/api/chargeCredit?user\_email=emailnonesistente@example\.com&amount=1       | 400    | 8 ms  |
| POST   | New Job \(NOT ENOUGH CREDIT\)        | http://localhost:3000/api/newJob                                                                 | 401    | 10 ms |
| POST   | New Job \(MISSING sess\_id\)         | http://localhost:3000/api/newJob                                                                 | 400    | 6 ms  |
| POST   | New Job \(MISSING n\_pred\)          | http://localhost:3000/api/newJob                                                                 | 400    | 7 ms  |
| POST   | New Job \(MISSING given\_points\)    | http://localhost:3000/api/newJob                                                                 | 400    | 8 ms  |
| POST   | New Job \(given\_points EMPTY LIST\) | http://localhost:3000/api/newJob                                                                 | 400    | 4 ms  |
| POST   | New Job \(given\_points LEN=1\)      | http://localhost:3000/api/newJob                                                                 | 400    | 6 ms  |
| POST   | New Job \(INVALID POINTS\)           | http://localhost:3000/api/newJob                                                                 | 400    | 6 ms  |
