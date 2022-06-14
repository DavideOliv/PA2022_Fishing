# PA2022_Fishing
Fishing trajectories reconstruction service API 

## Use Case
Per mezzo del diagramma "Use Case" sono stati modellati i requisiti richiesti nelle specifiche del progetto. 

Nel lato sinitro del diagramma ci sono i due attori attivi rappresentati dallo **User** e dall'**Admin** (estensione dello User). Essi hanno accesso a sei rotte ognuna per effettuare una richiesta diversa:

* **jobHistory** : per richiedere lo storico delle richieste e calcolarne eventualmente le statistiche
* **newJobsRequest** : per richiedere una specifica previsione su una traiettoria
* **JobStatus** : per richiedere lo stato attuale del processamento del job
* **ResultRequest** : per chiedere il risultato della previsione
* **CreditAvaiable** : per richiedere il credito attualmente disponibile
* **CreditCharge** : per richiedere di ricaricare i credite (operazione effettuata esclusivamente da un Adim).

E' da tener presente che ogni richiesta di previsione, costerà allo User un numero di crediti pari al numero di punti da predire moltiplicato per un fattore *k* (0.05). 

Queste richieste interagiscono con degli attori interni, che sono: **servizio bull-redis**, il **servizio Python** e il **database MongoDB**.

![Alt Text](https://github.com/DavideOliv/PA2022_Fishing/blob/dev/imgs/UseCase.png)

## Schema ER Database
Lo schema Entità Relazione del database progettato prevede 4 tabelle:

* **Users** : contente le informazioni di ogni utente
* **Jobs** : contenente le informazioni di un job
* **Sessions** : contenente le informazioni specifiche sulla sessione
* **Points** : punti di ogni sessione di pesca

E' visibile dalle relazione come ogni *User* può avere più *Job*, un *Job* può contenere al massimo una sessione di pesca (*Sessions*) e quest'ultima sarà descritta da n *Points*.

(Inserire Scema ER)

## MongoDB
La scelta di un database non relazionale è dettata dalla struttura dei dati a disposizione, per tanto è venuto naturale considerare la sessione come vettore di punti quindi abbiamo aggregato la relazione di *Points* e *Sessions* in un'unica collezione, dove ogni sessione è composta da un array di oggetti di tipo *Points*.
Anche la sessione a suo volta, essendo collegata a un *Job*, viene integrata come un campo nel documento dei *Jobs*. 
E' da sottolineare che al job è stato assegnato un concetto più generico nel quale non rappresenta esclusivamente il concetto di sessione di pesca, dunque è stato inserito un attributo che ne descriva il comportamento (*jobInfo*). Rimane inalterata la relazione tra *Job* e *User*, chee saranno le due collezioni che comporanno il nostro dabataset, connesse tramite *id_user*.

(Inserire MongoSchema)

## UML
In ottica della struttura di un'applicazione Node, Express, JS siamo partiti dal creare un modello come classe del nostro sistema di dati, per ogni tabella è stata creata un'interfaccia che ci permette di generalizzare le concretizzazione, dunque abbiamo implementato 4 interfacce per la rappresentazione della base di dati:
* **IUser**
* **IJob**
* **ISession**
* **IPoint**

Lo stato del job (*status*) e il ruolo dell'utente (*role*) sono stati modellati come enum. 

In particolare la classe più complessa è **Ijob**, perchè contiene il campo *jobInfo*, l'obiettivo è avere informazioni su come effettuare il processamento dei job, dunque abbiamo strutturato un'interfaccia **IJobinfo** per prevedere l'implementazione del metodo process. 
L'archittettura è stata generalizzata per prevedere più job, questa generalizzazione ci permette la creazione di nuovi job, diversi dal nostro, attraverso l'implementazione dell'interfaccia **Ijobinfo**. Abbiamo previsto la concretizzazione di questa interfaccia, che corrisponde a una sessione, di fatto abbiamo creato una classe che implememti contemporaneamente Isession (contenete gli attributi)  e Ijobinfo (contenete il metodo process). Questa classe concreta sarà compatibile con il campo jobInfo dell'intefaccia IJob. 

E' stata implementata la classe concreta **sessionJob** che implementa Ijob. 
I dati sono conservati all'interno di un database e vengono gestiti attraverso un'interfaccia **DAO** la quale espone i metodi crud, quest'ultima viene implementata concretamente dallo **UserDAO** e dal **JobDAO**. 
Inoltre per gestire i job associati ad ogni utente e il calcolo delle loro statistiche, abbiamo implementato un **Repository** sopra il DAO che verrà utilizzato dai controller per ritornare i risultati.

I job sono gestiti attraverso la libreria **Bull Redis** che abbiamo deciso di incapsulare all'interno della classe **Dispatcher** che si occupa di gestire i nuovi job assegnandoli alla coda di processi gestita da Bull, e tiene traccia dei cambiamenti di stato, aggiornando così il database attraverso i DAO. 

Infine la gestione delle rotte è lasciata alla classe **Controller** che le espone come API tramite l'applicazione Express, esso si appoggia al DAO, al Repository e al Dispatcher.

Si può notare che nel diagramma sottostante non è indicata la parte dei **Middlware** per l'autenticazione degli utenti e del **Main**, effettuate su file differenti e senza l'ausilio delle classi.

## Pattern Scelti
1) **Repository**: Per nascondere dietro un layer di astrazione l'implementazione delle operazioni di persistenza dati dal database (MongoDB).
