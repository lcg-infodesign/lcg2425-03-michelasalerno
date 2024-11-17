function preload() {
  // put preload code here
  data=loadTable("assets/riversData.csv", "csv", "header");
}

let circleSize= 500;
let padding= 90;

// variabili per i fiumi
//definisco i range in cui rimappare i valori dei fiumi
//il valore minimo del range si chiama start
//il valore massimo del range si chiama stop
let startLength = 50;
let stopLength = 240;
let startArea = 1;
let stopArea = 20;
let startTemp = 0;
let stopTemp = 1; // per usare lerpColor che fa sfumatura tra 0 e 1

function setup() {
  //cambio Australia in Oceania (era un errore no?)
  let allContinents = data.getColumn("continent"); //prendo tutti i continenti per tutte le righe
  for (let i=0; i<data.getRowCount();i++){
    if (allContinents[i] == "Australia") {
      data.setString(i, "continent", "Oceania"); //se trova nome "Australia" lo sostituisco con "Oceania". //set string modifica il dataset
    }
  }

  //trova lista di tutti i valori della colonna continent (che si ripetono)
  allContinents = data.getColumn("continent");

  //trova lista dei continenti senza ripetizioni
  let uniqueContinents = new Set(allContinents);
  let uniqueContinentsArray=[...uniqueContinents].sort(); //trasformo il set in un array (con i ...) e l'ho messo in ordine alfabetico (con il sort)
  
  let totalHeight= uniqueContinentsArray.length*(circleSize + padding)+padding;

  //FIUMI
  // creo i valori base su cui rimappare (map) tutti i valori delle lunghezze, aree e temperatura dei fiumi
  // valori min e max
  // delle lunghezze
  let maxLength = max(...data.getColumn("length").map(Number)); //non riesce a trovare max e min di una stringa, quindi è diventato un numero 
  let minLength = min(...data.getColumn("length").map(Number));
  // delle aree
  let maxArea = max(...data.getColumn("area").map(Number));
  let minArea = min(...data.getColumn("area").map(Number));
  // delle temperature medie
  let maxTemp = max(...data.getColumn("avg_temp").map(Number));
  let minTemp = min(...data.getColumn("avg_temp").map(Number));

  

  createCanvas(windowWidth, totalHeight); //lunghezza più ampia per fare scroll verticale
  // background(240, 240, 240);
  //CONTINENTI
  // creo ciclo for per disegnare cerchio con nome continente
  for (let i = 0; i < uniqueContinentsArray.length; i++) {
    let xCentro = windowWidth / 2;
    let yCentro = (padding + circleSize) * (i + 1) - circleSize / 2;
    noStroke();
    drawContinent(xCentro, yCentro, circleSize, uniqueContinentsArray[i]);
    // Aggiungi la legenda dopo il primo cerchio (o dove vuoi che appaia)
    if (i === 0) {  // Per esempio, la metto solo per il primo continente
      drawLegend(xCentro, yCentro, minTemp, maxTemp);
      // Aggiungi la legenda per lo spessore (area)
      drawAreaLegend(xCentro, yCentro, minArea, maxArea);
    }
    drawRivers(xCentro, yCentro, uniqueContinentsArray[i], data, maxLength, minLength, maxArea, minArea, maxTemp, minTemp);
  }
}

function draw() {
}

function drawContinent(xCentro, yCentro, diametro, continentName) {
  //disegno cerchi
  fill(245, 240, 220);
  circle(xCentro, yCentro, diametro);
  textAlign(CENTER);
  textSize(32);
  fill("black");
  text(continentName, xCentro, yCentro - diametro/2 - 32);
}

//FIUMI  
//creo una funzione che disegni i fiumi
//voglio disegnare linee che rappresentino ogni fiume
//la lunghezza della linea rappresenta la lunghezza del fiume
//il colore della linea rappresenta la temperatura media del fiume
//lo spessore del tratto rappresenta l'area del fiume

function drawRivers(xCentro, yCentro, continentName, rowData, maxLength, minLength, maxArea, minArea, maxTemp, minTemp) {
  // Trovo tutte le righe relative ai fiumi del continente specificato
  let rivers = rowData.findRows(continentName, "continent"); 
  // Calcolo l'angolo tra un fiume e il successivo (per distribuirli uniformemente)
  let sliceAngle = TWO_PI / rivers.length; 
  // Definisco i colori per le temperature (Blu per freddo, Rosso per caldo)
  let colorCold = color(77, 136, 255);
  let colorHot = color(255, 94, 77);

  // Itero su ogni fiume del continente
  //per ogni riga valuto la lunghezza, l'area e la temperatura media
  // e rimapppo i valori in base ai valori max e min generali 
  //rimappare è utile per convertire valori molto grandi
  //i nuovi estremi rimappati sono start e stop
  // |-----------------------------------------| range di partenza
  //                  diventa
  //             |---------------| nuovo range più piccolo e meglio rappresentabile 
  // per rimappare fa le proporzioni
  for (let r = 0; r < rivers.length; r++) {
    // Rimappo la lunghezza del fiume nel range desiderato
    let length = map(rivers[r].getNum("length"), minLength, maxLength, startLength, stopLength);
    // Rimappo l'area del fiume per definire lo spessore della linea
    let area = map(rivers[r].getNum("area"), minArea, maxArea, startArea, stopArea);
    // Rimappo la temperatura media del fiume per definire il colore
    let avgTemp = map(rivers[r].getNum("avg_temp"), minTemp, maxTemp, startTemp, stopTemp);

    // Calcolo l'angolo per la direzione del fiume rispetto al centro
    let angle = sliceAngle * r;
    // Interpolo il colore in base alla temperatura
    let riverColor = lerpColor(colorCold, colorHot, avgTemp);

    stroke(riverColor); 
    strokeWeight(area); 
    noFill();

    // Punto iniziale del fiume (sempre al centro del cerchio)
    let xStart = xCentro; 
    let yStart = yCentro; 
    // Punto finale del fiume (lunghezza determinata e direzione data dall'angolo)
    let xEnd = xCentro + cos(angle) * length; 
    let yEnd = yCentro + sin(angle) * length;

    // Imposto i parametri per creare la sinuosità della linea
    let amplitude = random(10, 20); // Ampiezza delle onde (valore casuale)
    let wavelength = random(100, 150); // Lunghezza d'onda delle onde (valore casuale)
    let numPoints = 100; // Numero di punti per costruire la curva (più punti = curva più fluida)

    beginShape();
    // Itero sui punti tra l'inizio e la fine del fiume per creare la sinuosità
    for (let i = 0; i <= numPoints; i++) {
      // Calcolo il parametro t che va da 0 (inizio) a 1 (fine)
      let t = i / numPoints; 
      // Calcolo la posizione del punto lungo la retta (senza sinuosità)
      let x = lerp(xStart, xEnd, t); 
      let y = lerp(yStart, yEnd, t);

      // Applico la funzione seno per generare l'offset verticale
      let sineOffset = sin(t * TWO_PI * length / wavelength) * amplitude;

      // Ruoto l'offset nel sistema di riferimento della retta
      let perpX = -sin(angle) * sineOffset; 
      let perpY = cos(angle) * sineOffset;

      // Aggiungo l'offset calcolato alla posizione originale del punto
      let xNew = x + perpX; 
      let yNew = y + perpY;

      // Aggiungo il punto con offset alla curva
      curveVertex(xNew, yNew); 
    }
    endShape();
  }
}

function drawLegend(xCentro, yCentro, minTemp, maxTemp) {
  // Distanza tra il cerchio e la legenda
  let legendWidth = 20; // Larghezza del rettangolo
  let legendHeight = 200; // Altezza del rettangolo
  let legendX = xCentro + circleSize / 2 + 100; // Posizione orizzontale a destra del cerchio
  let legendY = yCentro - legendHeight / 2; // Posizione verticale centrata rispetto al cerchio

  // Disegno il gradiente tra i colori freddi e caldi
  let colorCold = color(77, 136, 255);  // Blu (freddo)
  let colorHot = color(255, 94, 77);   // Rosso (caldo)
  
  // Disegno il rettangolo con gradiente
  for (let i = 0; i < legendHeight; i++) {
    let lerpColorValue = map(i, 0, legendHeight, 0, 1); // Mappa l'altezza per ottenere una transizione
    let col = lerpColor(colorHot, colorCold, lerpColorValue); // Interpolazione del colore
    stroke(col);
    line(legendX, legendY + i, legendX + legendWidth, legendY + i); // Disegna una linea per ogni pixel della sfumatura
  }

  // Testo per le temperature minima e massima
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text("Temp: " + nf(minTemp, 1, 2) + "°C", legendX + legendWidth + 5, legendY + legendHeight); // Minima
  text("Temp: " + nf(maxTemp, 1, 2) + "°C", legendX + legendWidth + 5, legendY); // Massima
}

function drawAreaLegend(xCentro, yCentro, minArea, maxArea) {
  // Posizione della legenda a sinistra del primo cerchio
  let legendWidth = 100;
  let legendHeight = 200;
  let legendX = xCentro - circleSize / 2 - legendWidth - 100; // Posizione orizzontale a sinistra del cerchio
  let legendY = yCentro - legendHeight/4; // Posizione verticale centrata rispetto al cerchio

  // Definisco i cinque spessori
  let thicknessMin = 1;  // Spessore minimo
  let thicknessMax = 20; // Spessore massimo
  let numLines = 5;      // Numero di tratti

  // Disegno i tratti orizzontali con spessori diversi
  for (let i = 0; i < numLines; i++) {
    let x1 = legendX;
    let x2 = legendX + legendWidth;
    let y = legendY + i * 20 + 10; // Distanza verticale tra i tratti

    // Calcolo lo spessore del tratto in base alla posizione
    let thickness = map(i, 0, numLines - 1, thicknessMin, thicknessMax);
    stroke(0); 
    strokeWeight(thickness);
    line(x1, y, x2, y);
  }

  // Testo per le aree minime e massime
  fill(0);
  strokeWeight(0);
  textSize(16);
  textAlign(RIGHT, CENTER);
  text(nf(minArea, 1, 2) + " km²", legendX - 10, legendY + 8); // A sinistra, area minima
  text(nf(maxArea, 1, 2) + " km²", legendX - 20, legendY + (numLines - 1) * 20 + 10); // A sinistra, area massima
}