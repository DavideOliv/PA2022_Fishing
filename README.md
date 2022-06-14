# Progetto di Programmazione Avanzata 2022
L'applicazione permette agli utenti registrati nel database di predirre n punti di traiettorie delle navi.

## Use Case
Per mezzo del diagramma "Use Case" sono stati modellati i requisiti richiesti nelle specifiche del progetto. 

Nel lato sinitro del diagramma ci sono i due attori attivi rappresentati dallo **User** e dall'**Admin** (estensione dello User). Essi hanno accesso a sei rotte ognuna per effettuare una richiesta diversa:

* **jobHistory** : per richiedere lo storico delle richieste e calcolarne eventualmente le statistiche
* **newJobsRequest** : per richiedere una specifica previsione su una traiettoria
* **JobStatus** : per richiedere lo stato attuale del processamento del job
* **ResultRequest** : per chiedere il risultato della previsione
* **CreditAvaiable** : per richiedere il credito attualmente disponibile
* **CreditCharge** : per richiedere di ricaricare i crediti (operazione effettuata esclusivamente da un Adim).

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
La scelta di un database non relazionale è dettata dalla struttura dei dati a disposizione, per tanto è venuto naturale considerare la sessione come vettore di punti quindi abbiamo aggregato la relazione di *Points* in *Sessions* la quale verrà successivamente integrate nel campo *job_info* della collezione **Jobs**. E' intuibile che sessione è composta da un array di oggetti di tipo *Points*, e le informazioni saranno utilizzate dal *Job*.
E' da sottolineare che al job è stato assegnato un concetto più generico nel quale non rappresenta esclusivamente il concetto di sessione di pesca, ma qualsiasi tipo di task specificato nel campo *job_info*. 
Rimane inalterata la relazione tra **Jobs** e **User**, che saranno le due collezioni che comporanno il nostro dabataset, connesse tramite *id_user*.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/MongoDB.png)

## UML
In ottica della struttura di un'applicazione *Node, Express, JS* siamo partiti dal creare un modello come classe del nostro sistema di dati, per ogni tabella presentata nello schema ER è stata creata un'interfaccia che ci permette di generalizzare le concretizzazione, e un schema creato da *mongoose* per le due collezioni sopra descritte.
Dunque abbiamo implementato 5 interfacce per la rappresentazione della base di dati:
* **IUser**
* **IJob**
* **ISession**
* **IPoint**
* **IMongoEnitity** (contenente solo l'ObjectID per collegare IUser e IJob già presenti nel DB )

Lo stato del job (*status*) e il ruolo dell'utente (*role*) sono stati modellati come enum. 

L'archittettura è stata generalizzata per prevedere più job, questa generalizzazione ci permette la creazione di nuovi job, diversi dal nostro, attraverso l'implementazione di un'interfaccia che specifichi il campo *job_info*, nel nostro caso il campo sarà di tipo *ISession*. 
 
I dati sono conservati all'interno di un database e vengono gestiti utilizzando la libreria *mongoose* la quale espone i metodi CRUD, quest'ultima rappresenta intrinsicamente un pattern DAO separando la logica di business dalla logica di acceso ai dati.
Dunque per gestire i job associati ad ogni utente, abbiamo implementato un **Repository** sopra il DAO che verrà utilizzato dal **Service** per ritornare i risultati e le statistiche chieste dall'utente.
Nel **Service** vengono implementati tutti quei metodi che andranno a soddisfare le richeste dell'utente finale, inoltre esso utilizza un'interfaccia **IStats** per gestire le statistiche sui job. Infine implementa anche i metodi dell'interfaccia **IJobEventsListener**  responsabile di gestire i cambi di stato dei processi nella coda aggiornando il DB.
Il **Dispatcher** incapsula la logica di **Bull** e implementa due metodi, uno per aggiungere i processi nella coda gestita da **Bull Redis** e l'altro per lanciare le callback ad ogni cambio di stato di quest'ultimi. Esso utilizza l'interfaccia **IProcessor**, implementata dalla classe **SessionJobProcessor**, la quale è responsabile di validare se il job è di tipo *ISession*, calcolare il prezzo per la previsione e sopratutto implementare il metodo *process()* chiamato sui processi in coda, il quale è responsabile di interrogare il servizio **Python** e ritornare i risultati previsti.

La gestione delle rotte è lasciata alla classe **Service** che le espone come API tramite l'applicazione Express, essa si appoggia al DAO, al Repository e al Dispatcher.

Si può notare che nel diagramma sottostante non è indicata la parte dei **Middlware** per l'autenticazione degli utenti e del **Main**, effettuate su file differenti e senza l'ausilio delle classi.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/Class_Diagram.png)

## Pattern Scelti
1) **Repository**: Per nascondere dietro un layer di astrazione l'implementazione delle operazioni di persistenza dati dal database (MongoDB)
2) **Singleton**: Utilizzato per la classe **Service** con lo scopo di garantire che venga creata una e una sola istanza e che sia in grado di fornire un punto di accesso globale a tale istanza.
3) **Observer**: L'Observer nel nostro caso è la classe Service che definisce i metodi che l'Observer può osservare, mentre il Dispatcher incapsulando la logica di Bull è l'Observable che invia le notifiche sui cambi di stato.
