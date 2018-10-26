// URL: https://beta.observablehq.com/d/46e43adf74f9a8a9
// Title: ADD TRENDS: NYC emergency response times and Local Law 119
// Author: Chris Prince (@cmprince)
// Version: 5943
// Runtime version: 1

//require("d3-format")
//const L = require('leaflet@1.2.0')
// require('https://bundle.run/soda-js@0.2.3')
// const consumer = new soda.Consumer('data.cityofnewyork.us')

// Data that has already been downloaded or processed
const boroData = [{'borough':'Manhattan', 'CD':'100'},
            {'borough':'Bronx', 'CD':'200'},
            {'borough':'Brooklyn', 'CD':'300'},
            {'borough':'Queens', 'CD':'400'},
            {'borough':'Staten Island', 'CD':'500'}]
const cdNames = d3.csv("cdNames.csv")
const fdnyLocations = d3.csv("fdnyLocations.csv")
const nycCD = d3.json("./nycCD.json")
const trends = d3.json("./trends.json")
const cdfs = d3.json("./cdfs.json")
const dataSets = d3.json("./dataSets.json")
const recordNumbers = d3.json("./recordNumbers.json")

const margin = {top: 5, right: 70, bottom: 60, left: 80}
const height = 180
const agencies = ['FDNY', 'EMS']
const LLCategories = new Object({
  FDNY: ["Structural Fires", "NonStructural Fires", "Medical Emergencies", "NonMedical Emergencies"],
  EMS: ["Segment 1", "Life-threatening", "Non-life-threatening"]})
const revLLCats = Object.keys(LLCategories).reduce((acc, propName) =>          
  LLCategories[propName].reduce((a, num) => {
    a[num] = propName;
    return a;
  }, acc), {})

let fireCat = LLCategories["FDNY"][0]

//Populate the select box
let catSelector = document.getElementById('CategoryBox')
for (let agcy of agencies) {
    let opt = document.createElement('optgroup')
//    opt.innerHTML = agcy
//    opt.value = agcy
    opt.label = agcy
    catSelector.appendChild(opt)
    for (let cat of LLCategories[agcy]) {
        let opt = document.createElement('option')
        opt.innerHTML = agcy + ": " + cat 
        opt.value = cat
        catSelector.appendChild(opt)
    }
}

catSelector.onchange = function () {
    fireCat = this.value
    agency = revLLCats[fireCat]
    binsize = binsizes[agency]
    dataCat = justCat()
    catGraphUpdates()
    updateHist()
}

function catGraphUpdates () {
    color = d3.scaleQuantize()
      .domain(domains[agency])
      .range(colorSchemes[agency])

    x2 = d3.scaleLinear()
        .domain([0, binsize*numbins]) // d3.max(testd.map(x=>+x.timebin+30))]) 
        .range([margin.left, window.innerWidth - margin.right])
    
    legendX = d3.scaleLinear()
        .domain(domains[agency])
        .range([0, 260])

    d3.select("#map-container").selectAll("path").transition(t).call(reColor)

    const indicators = d3.select("#legendIndicators").selectAll("rect")
    indicators.data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = legendX.domain()[0];
      if (d[1] == null) d[1] = legendX.domain()[1];
      return d;
    }))
    indicators.exit().remove()
    indicators.attr("height", 8)
        .style('fill-opacity', 0.5)
        .attr("x", function(d) { return legendX(d[0]); })
        .attr("width", function(d) { return legendX(d[1]) - legendX(d[0]); })
        .attr("fill", function(d) { return color(d[0]); })
    indicators.enter().append("rect")
        .attr("height", 8)
        .style('fill-opacity', 0.5)
        .attr("x", function(d) { return legendX(d[0]); })
        .attr("width", function(d) { return legendX(d[1]) - legendX(d[0]); })
        .attr("fill", function(d) { return color(d[0]); })

    const legend = d3.select("#legend")
    legend.select("text")
      .attr("x", legendX.range()[0])
    
    legend.call(d3.axisBottom(legendX)
      .tickSize(13)
      .tickValues(d3.range(...domains[agency], 50)))
    .select(".domain")
      .remove();
}

//const these until I get the layout right
//let fireCat = "Segment 1"
let agency = revLLCats[fireCat]
let pct = 0.90

// The width of the bins in seconds.
const binsizes = new Object({FDNY: 15, EMS: 30})
let binsize = binsizes[agency]
// The number of bins to retrieve (covering a total period of \`binsize * numbins\`)`
const numbins = 60
// This is a \`mutable\` cell containing the selected Community District number`
let cd = ""
// Collect some statistics on each community district`

// This cell adds LatLng point objects from the individual Lat and Lng fields`
// Make a LatLng Object for each entry's Lat and Lng strings
async function addLatLng(){
  await fdnyLocations.forEach(function(d) {
    d.LatLng = new L.LatLng(d.Latitude, d.Longitude)})
}


function filterByCat(d){
  /*if (this == "All")
    return LLCategories[agency].includes(d.icg);
  else*/
  theCat = this.valueOf()   // unsure why this became a string object instead of literal
  if (LLCategories['FDNY'].includes(theCat)){ //agency == "FDNY")
    return d.icg == theCat;}
  else { 
    const idx = LLCategories['EMS'].indexOf(theCat)
    const includeCats = LLCategories['EMS'].slice(0,idx+1)
    return includeCats.includes(d.icg)}
}

function filterByCD2(d){
  // to be passed in the callback with a parameter, which becomes 'this', e.g., 
  // when calling .filter(filterByCD, cd), cd becomes 'this'.
  //console.log(d, this)
  if (this=="") {return true} //this line wasn't necessary in notebook?
  return (this) ?
    (this % 100) ?
      (+d.CD == +this)
    :
      ((d.CD > +this) && (d.CD < (+this +100)))
    :
      true;
}

function reduceByTimebin(data){
  let reducer = data.reduce(function(pv, cv) {
    if ( pv[cv.timebin] ) {
        pv[cv.timebin] += +cv.count;
    } else {
        pv[cv.timebin] = +cv.count;
    }
    return pv;
}, {})
  let returnObjList = []
    Object.entries(reducer).forEach(
    ([key, value]) => {
      var obj = {"timebin": key, "count": value};
      returnObjList.push(obj)}
)
  return returnObjList
}

async function quantileFromHistogram(q, data, thisCD, thisCat, thisMonth="") {
  //console.log('why am i running')
  let sum = 0;
  let numberInCD = (await recordNumbers)
                        .filter(filterByCD2, thisCD)
                        .filter(filterByCat, thisCat)
  if (thisMonth) { numberInCD = numberInCD.filter(d => d.month==thisMonth)} //(d=>fireCat==d.icg) 
  numberInCD = numberInCD.reduce((sum, d) => sum += +d.count, 0)
  let quantilePosition = numberInCD * q  //don't care if it's an integer
  
  let i = 0;
  while (sum < quantilePosition){ 
    try{
      sum += +data[i++].count }
    catch(err) {
      return 2000
    }
  }
  
  // after this sum, 
  // data[i] is the bin after the median, 
  // data[i-1] is the bin with the median, and
  // data[i-2] is the bin before the median.
  // First determine the number of items the last bin caused the sum to go past the median
  
  const bsize = binsizes[revLLCats[thisCat]]
  const delta = sum - quantilePosition;
  
  try{
  
  //console.log(i, quantilePosition, delta, sum)
  //Assume items in bin are distributed along the slope of the line connecting the adjacent bins
  //use y= m(x-x1)+y1, m=(bin[i]-bin[i-2])/2*binwidth
  const m = (+data[i].count-data[i-2].count)/2/bsize
  let y = (x, x1, y1) => m*(x-x1)+y1;
  const leftEdge = y(+data[i-1].timebin, +data[i].timebin-bsize/2, +data[i].count)
  const rightEdge = y(+data[i].timebin, +data[i].timebin-bsize/2, +data[i].count)
  
  //Assume uniform distribution (OK if change is small wrt binheights in region of median)
  //Median is unlikely to fall on a non-integer in this data, so use round()
  //return Math.round(+data[i].timebin - delta/data[i-1].count * binsize)
  const gamma = 1 - delta/(+data[i-1].count)
  const alpha = (leftEdge==rightEdge)?
        gamma:
        (leftEdge-Math.sqrt((1-gamma)*leftEdge**2+rightEdge**2*gamma))/(leftEdge-rightEdge)
  
  const inferred = Math.round(+data[i-1].timebin + alpha*bsize)

  //Fallback to a simple calculation if above fails
  return inferred //|| Math.round(+data[i].timebin - delta/data[i-1].count * bsize)
  } catch(err) {return NaN}
}

function ordinalSuffix(num){
  switch(num){
    case 0: return "th"
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    case 4: return "th"  
    case 5: return "th"  
    case 6: return "th"        
    case 7: return "th"      
    case 8: return "th"      
    case 9: return "th"      
    case 11: return "th"
    case 12: return "th"
    case 13: return "th"
    default: return ordinalSuffix(num%10)
  }
}

async function justCat() { return (await dataSets).filter(filterByCat, fireCat) }
let dataCat = justCat()

async function fd(d){
    const thedata = await d
    return reduceByTimebin(thedata.filter(filterByCD2,cd)) //.filter(filterByCat,fireCat))
}
    
let filterData = fd(dataCat) //reduceByTimebin(dataSets.filter(filterByCD2, cd).filter(filterByCat, fireCat))

const colorSchemes = new Object({EMS: d3.schemeBlues[6], FDNY: d3.schemeReds[5]})
const domains = new Object({EMS: [250,550], FDNY: [150,400]})
let color = d3.scaleQuantize()
  .domain(domains[agency])
  .range(colorSchemes[agency])

// Axes and scaling functions
// function linea(d){
//     return d3.line()
//         .x(d => x2(+d.timebin))
//         .y(d => y3(+d.cdf))
// }
let linea = d3.line()
    .x(d=>x2(+d.timebin))
    .y(d=>y3(+d.cdf))
let lineaDate = d3.line()
    .x(d => dateScale(new Date(d.month)))
    .y(d => medianScale(+d.median))
let x2 = d3.scaleLinear()
    .domain([0, binsize*numbins]) // d3.max(testd.map(x=>+x.timebin+30))]) 
    .range([margin.left, window.innerWidth - margin.right])
let dateScale = d3.scaleTime()
    .domain([new Date(2013, 0, 1, 0), new Date(2017, 11, 31, 12)])
    .range([margin.left, window.innerWidth - margin.right])
let dateAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(dateScale).ticks(d3.timeYear).tickSizeOuter(0))
    .call(g => g.append("text")
        .attr("x", window.innerWidth - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(dataSets.timebin))
let medianScale = d3.scaleLinear()
    .domain([150, 600]).nice()
    .range([height - margin.bottom, margin.top])
let medianAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(medianScale))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
let y2 = d3.scaleLinear()
    .domain([0, d3.max(filterData, d => +d.count)]).nice()
    .range([height - margin.bottom, margin.top])
let y3 = d3.scaleLinear()
    .domain([0, 1]).nice()
    .range([height - margin.bottom, margin.top])
let legendX = d3.scaleLinear()
    .domain(domains[agency])
    .range([0, 260])
let xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x2).tickSizeOuter(0))
    .call(g => g.append("text")
        .attr("x", window.innerWidth - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(dataSets.timebin))
let yAxis2 = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y2))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
let yAxis3 = g => g
    .attr("transform", `translate(${window.innerWidth-margin.right},0)`)
    .call(d3.axisRight(y3))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
let t = () => d3.transition()
                            .duration(250)
                            .ease(d3.easeLinear)
let reColor = d  =>  d.style('stroke', "#bbb")
                            .style('stroke-width', "1px")
                            .style("fill", function(d) { 
                              try {
                                return color(d.properties.median[agency][fireCat][0].median); }
                              catch(e) {
                                return color(0)}
                            })
let selectColor = d  =>  d.style('stroke', "#ff0")
                            .style('stroke-width', "3px")
                            .style("fill", "#fcf")
let boxColor = d  =>  d.style('stroke', "blue")
                            .style('stroke-width', "1px")
                            .style("fill", "#ddd")
d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  }

class mytooltip {
  
  constructor(opts) {
    this.ttWidth = opts.ttWidth || 200
    this.ttHeight = opts.ttHeight || 20
    this.xoffset = opts.xoffset || 0
    this.text = ""
    this.context = opts.context
    this.align = opts.align || "middle"
    this.fontsize = opts.fontsize || '16px'
    this.tip = this.context.append("g")
                  .attr("class", "tooltip")
                  .style("display", "none")
    this.tip.append("text")
            .attr('font-family', 'sans-serif')
            .attr('font-size', this.fontsize)
            .attr('font-weight', 'bold')
            .attr("dx", this.align == "start" ? this.xoffset : this.align == "end" ? -this.xoffset : 0)
            .attr("dy", "0.4em")
            .attr("pointer-events", "none")
            .style("text-anchor", this.align)
            .style("dominant-baseline", "center")
            //.attr("font-size", "12px")
            //.attr("font-weight", "bold");
  }
    
  setText(string) {
    this.text = string
    this.tip.select("text").text(this.text)
  }
  
  setPosition(x, y) {
    this.x = x
    this.y = y
    this.tip.transition().duration(50).attr("transform", "translate(" + this.x + "," + this.y + ")"); 
  }
  
  setAlign(align) {
    if (this.align == align) {return;}
    this.align = align
    this.tip.selectAll("text").transition().duration(50)
      .attr("dx", this.align == "start" ? this.xoffset : this.align == "end" ? -this.xoffset : 0) 
      .style("text-anchor", this.align)
  }
    
  setVisibility(vis) {
    this.vis = vis
    this.tip.style("display", this.vis)
  }
    
  remove() {
    // should I have a remove?
  }
}


/*
    {
      name: "viewof agency",
      inputs: ["radio"],
      value: (function(radio){return(
radio({
  title: 'Reporting agency',
  options: [
    { label: 'FDNY', value: 'FDNY' },
    { label: 'EMS', value: 'EMS' },
  ],
  value: 'EMS'
})
)})
    },
    {
      name: "agency",
      inputs: ["Generators","viewof agency"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof pct",
      inputs: ["slider"],
      value: (function(slider){return(
slider({
  min: 0.01, 
  max: 0.99, 
  step: 0.01,
  value: 0.90,
  format: "0.0%",
  title: "Percentile",
  description: "Adjusts the red Percentile indicator below"
})
)})
    },
    {
      name: "pct",
      inputs: ["Generators","viewof pct"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof fireCat",
      inputs: ["agency","select","LLCategories"],
      value: (function(agency,select,LLCategories){return(
(agency=="FDNY") 
  ? select({
      title: "FDNY classifications",
      description: "LL119 categories",
      options: LLCategories['FDNY'], //["All", ...LLCategories['FDNY']],
      value: "Structural Fires"
    })
  : select({
      title: "EMS classifications",
      description: "LL119 categories",
      options: LLCategories['EMS'], //["All", ...LLCategories['EMS']],
      value: "Segment 1"
    })
)})
    },
    {
      name: "fireCat",
      inputs: ["Generators","viewof fireCat"],
      value: (G, _) => G.input(_)
    },*/

//TODO: this is the trend chart that needs to be included
/*
    {
      name: "trend",
      inputs: ["d3","DOM","width","height","mytooltip","trends","fireCat","cd","lineaDate","recordNumbers","filterByCD2","filterByCat","nycCD","agency","quantileFromHistogram","pct","filterData","dateAxis","margin","medianAxis","x2","binsize","dateScale"],
      value: (function(d3,DOM,width,height,mytooltip,trends,fireCat,cd,lineaDate,recordNumbers,filterByCD2,filterByCat,nycCD,agency,quantileFromHistogram,pct,filterData,dateAxis,margin,medianAxis,x2,binsize,dateScale)
{
  //console.log(width, height)
  const svg = d3.select(DOM.svg(width, height));
  
  const ttWidth = 200
  const ttHeight = 20
  
  const tooltip = new mytooltip({context: svg})
  
  /*let serie = svg.append('g')
    .selectAll("g")
    .data(huh)
    .enter().append("g");
  */
  /*const meddata = nycCD.features
                       .filter(d => +d.properties.boro_cd == +cd)[0]
                       .properties
                       .median[agency][fireCat].slice(1)*/
/*  
  let serie = svg.append('g')
    .selectAll("g")
    .data(trends.filter(d=>d.icg==fireCat))
    .enter().append("g");
  
  serie.append("path")
      .attr("fill", "none")
      .style("stroke-width", d => (+d.CD==+cd) ? 5 : 0.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("stroke", d => (+d.CD==+cd) ? "#fcf" : "#ddd")
      .attr("d", d => lineaDate(d.trend))
      .style("display", d => +cd == "" ? null : +cd%100 ? 
                                (+d.CD%100 ? null : "none") :
                                (+d.CD >= +cd && +d.CD < (+cd + 100) ? 
                                   null  : "none"));
  
  const meddata = trends.filter(d => +d.CD == +cd).filter(d => d.icg == fireCat)
  let medcurve = svg.append("g").append("path")
      .style("fill", "none")
      .style("stroke-width", 5) // d => (+d.cd==+cd) ? 5 : 0.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("stroke", "#000") //d => (+d.cd==+cd) ? "#fcf" : "#ddd")
      .attr("d", lineaDate(meddata)) //d => {console.log(d, lineaDate(d)); return lineaDate(d) })
      .style("display", null)
      //.style("display", d => +cd == "" ? null : +cd%100 ? 
        //                        (+d.cd%100 ? null : "none") :
          //                      (+d.cd >= +cd && +d.cd < (+cd + 100) ? 
            //                       null  : "none"));
//console.log(nycCD.features.filter(d => +d.properties.boro_cd == +cd)[0].properties.median[agency][fireCat])
  const totalcalls = recordNumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                      .reduce((sum, d) => sum += +d.count, 0)
  const median = nycCD.features.filter(d=>+d.properties.boro_cd==+cd)[0].properties.median[agency][fireCat] 
  const ninetyPct = quantileFromHistogram(pct, filterData, cd);
  const average = recordNumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                    .reduce((sum, d) => sum += +d.count * +d.avg, 0)/totalcalls

  
  const indicators = [] //[ninetyNote, ninetyLine, medianNote, medianLine, averageNote, averageLine, serie]
  const tips = [] //[tooltip, counttip, moreThanTip, lessThanTip, totaltip]
  
  const dateAx = svg.append("g")
      .attr('class', "xAxis")
  
  dateAx.call(dateAxis)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr("transform",`translate(${(width - margin.left - margin.right)/2 + margin.left}, 30)`)
      .attr("fill","black")
      .attr("align","center")
      .style("text-anchor", "middle")
      .text('months');
  
  const medianAx = svg.append("g")
      .attr('class', "yAxis1")
  
  medianAx.call(medianAxis)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .text('median response time')
      .attr("align","center")
      .attr("transform",`rotate(-90)translate(-25, -50)`)  
      .attr("fill","black")
    
  //if (cd%100) { serie.filter(d=>+d.cd==+cd).moveToFront() }
  
  svg.on("mouseover", () => {  
    const [xCoord, yCoord] = d3.mouse(svg.node());
    const top = yCoord > height - margin.bottom;
    const hoverSecs = x2.invert(xCoord);
    const hoverBin = hoverSecs - hoverSecs % binsize;

    for (let t of tips) {t.setVisibility(null)}
    for (let e of indicators) {e.style("display", "none")}
    dateAxis.style("opacity", 0.2)
    medianAxis.style("opacity", 0.2)
  })
  
  svg.on("mouseout", () => {
  })
  
  svg.on("mousemove", () => {
    const [xCoord, yCoord] = d3.mouse(svg.node());
    const top = yCoord > height - margin.bottom;
    const hoverSecs = x2.invert(xCoord);
    const hoverBin = hoverSecs - hoverSecs % binsize;
    let xPosition = x2(hoverBin + binsize) //d3.mouse(this)[0] - ttWidth/2;
    let yPosition = height-40 //d3.mouse(this)[1] - (ttHeight + 5);
  })

  svg.append("g")
    .attr("class", "brush")
    .call(d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushended));

function brushended() {
  if (!d3.event.sourceEvent) return; // Only transition after input.
  if (!d3.event.selection) return; // Ignore empty selections.
  var d0 = d3.event.selection.map(dateScale.invert),
      d1 = d0.map(d3.timeMonth.round);

  // If empty when rounded, use floor & ceil instead.
  if (d1[0] >= d1[1]) {
    d1[0] = d3.timeMonth.floor(d0[0]);
    d1[1] = d3.timeMonth.offset(d1[0]);
  }

  d3.select(this).transition().call(d3.event.target.move, d1.map(dateScale));
}
  
  //svg.on("click", () => { histMode = !histMode; console.log(histMode) })
  
  d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  
  return svg.node();
  */

  d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

const svgHist = d3.select("#histogram").append("svg").style("width", "100%"); //DOM.svg(width, height));
const gBar = svgHist.append("g").style("fill", "gray")
const gPath = svgHist.append("g")
const counttip = new mytooltip({context: svgHist, ttWidth: 50, align: "end"})
const tooltip = new mytooltip({context: svgHist})
const totaltip = new mytooltip({context: svgHist, align: "end", xoffset: 20})
const lessThanTip = new mytooltip({context: svgHist, align: "end", xoffset: 10, fontsize: '40px'})
const moreThanTip = new mytooltip({context: svgHist, align: "start", xoffset: 10, fontsize: '40px'})

async function updateHist() {

  const filterdata = await fd(dataCat) //was dataSets 
  const recordnumbers = await recordNumbers
  const ninetyPct = await quantileFromHistogram(pct, filterdata, cd, fireCat);
  const totalcalls = recordnumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                      .reduce((sum, d) => sum += +d.count, 0);
  const average = recordnumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                    .reduce((sum, d) => sum += +d.count * +d.avg, 0)/totalcalls
  const medobj = (await nycCD).features.filter(d=>+d.properties.boro_cd==+cd)[0]
                    .properties.median[agency][fireCat]
  const median = medobj.length ? medobj[0].median : NaN
  const ttWidth = 200
  const ttHeight = 20

  totaltip.setText(d3.format(",")(totalcalls) + " total calls")
  totaltip.setPosition(x2(binsize*numbins),y3(0.9))
  totaltip.setVisibility("none")

  let y2 = d3.scaleLinear()
    .domain([0, d3.max(filterdata, d => +d.count)]).nice()
    .range([height - margin.bottom, margin.top])
  let yAxis2 = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y2))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
  let yAxis3 = g => g
    .attr("transform", `translate(${window.innerWidth-margin.right},0)`)
    .call(d3.axisRight(y3))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))

  const bar = gBar.selectAll("rect")
    .data(filterdata)

  bar.exit().remove()
  bar.transition().duration(150).attr("height", d => y2(0) - y2(d.count)).style("fill", "gray")
    .attr("x", d => x2(d.timebin) +1  )
    .attr("y", d => y2(d.count))

  bar.enter().append("rect")
    .attr("x", d => x2(d.timebin) +1  )
    .attr("width", d => x2(.975*binsize)-x2(.025*binsize))
    .attr("y", d => y2(d.count))
    .attr("height", d => y2(0) - y2(d.count))
 
  const cdf = await cdfs
  let serie = gPath
    .selectAll("g")
    .data(cdf.filter(d=>d.month=="").filter(d=>d.icg==fireCat))
    .enter().append("g");
  
  serie.append("path")
      .attr("fill", "none")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")

  gPath.selectAll("path")
      .style("stroke", d => (+d.CD==+cd) ? "#fcf" : "#ddd")
      .attr("d", d => { console.log(d.CD, +cd); return linea(d.cdf||0)})
      .style("stroke-width", d => (+d.CD==+cd) ? 5 : 0.5)
      .style("display", d => +cd == "" ? null : +cd%100 ? 
                                (+d.CD%100 ? null : "none") :
                                (+d.CD >= +cd && +d.CD < (+cd + 100) ? 
                                   null  : "none"));

  if (cd%100) { serie.selectAll("path").filter(d=>+d.cd==+cd).moveToFront() }
  
  const hoverLine = d3.selectAll("#hoverLine")
  const countLine = d3.selectAll("#countLine")
  const medianLine = d3.selectAll("#medianLine")
  const averageLine = d3.selectAll("#averageLine")
  const ninetyLine = d3.selectAll("#ninetyLine")
  const medianNote = d3.selectAll("#medianNote")
  const averageNote = d3.selectAll("#averageNote")
  const ninetyNote = d3.selectAll("#ninetyNote")
  const indicators = [ninetyNote, ninetyLine, medianNote, medianLine, averageNote, averageLine, serie]
  const tips = [tooltip, counttip, moreThanTip, lessThanTip, totaltip]

  const timeAxis = d3.select('.xAxis')
  timeAxis.call(xAxis)
  const countAxis = d3.select('.yAxis1')
  countAxis.call(yAxis2)

  medianLine
      .attr('x1', x2(median))
      .attr('y1', y3(0))
      .attr('x2', x2(median))
      .attr('y2', y3(0.5)) //margin.top)
  
  averageLine
      .attr('x1', x2(average))
      .attr('y1', y2(0))
      .attr('x2', x2(average))
      .attr('y2', y3(1))
  
  ninetyLine
      .attr('x1', x2(ninetyPct))
      .attr('y1', y2(0))
      .attr('x2', x2(ninetyPct))
      .attr('y2', y3(pct)) //margin.top+60)

  medianNote 
      .attr('x', x2(median))
      .attr('text-anchor', (pct>0.45 & pct<0.55)? 'end':'start')
      .attr('transform', `translate(0,${y3(0.5)})`)
      .attr("dx", `${0.2 * ((pct>0.45 & pct<0.55)?-1:1)}em`)
      .text(`${"Median = " + median + " seconds"}`)
  
  averageNote
      .attr('x', x2(average))
      .attr('transform', `translate(0,${y3(1)})`)
      .text(`Average = ${Math.round(average)} seconds`)
  
  ninetyNote
      .attr('x', Math.min(x2(binsize*numbins),x2(ninetyPct)))
      .attr('text-anchor', (x2(ninetyPct) > (window.innerWidth-240))? 'end':'start')
      .attr('transform', `translate(0,${Math.max(Math.min(y3(0.1),y3(pct)),y3(0.9))})`)
      .attr("dx", `${0.2 * ((x2(ninetyPct) < (window.innerWidth-240))?1:-1)}em`)
      .text(`${Math.round(pct*100)}${ordinalSuffix(Math.round(pct*100))} Percentile ` + (ninetyPct > binsize*numbins ? `more than ${binsize*numbins} seconds`: `= ${ninetyPct} seconds`))

  svgHist.on("mouseover", () => {  
    const [xCoord, yCoord] = d3.mouse(svgHist.node());
    const top = yCoord > height - margin.bottom;
    const hoverSecs = x2.invert(xCoord);
    const hoverBin = hoverSecs - hoverSecs % binsize;

    for (let t of tips) {t.setVisibility(null)}
    for (let e of indicators) {e.style("display", "none")}
    hoverLine.style("display", null)
    countLine.style("display", null)
    timeAxis.style("opacity", 0.2)
    countAxis.style("opacity", 0.2)
  })
  
  svgHist.on("mouseout", () => {
    bar
      .transition()
      .duration(150)
      .ease(d3.easeLinear)
      .style("fill", "gray")
      .style("stroke", "none")
    for (let t of tips) {t.setVisibility("none")}
    for (let e of indicators) {e.style("display", null)}
    hoverLine.style("display", "none")
    countLine.style("display", "none")
    timeAxis.style("opacity", 1)
    countAxis.style("opacity", 1)      
  })
  
  svgHist.on("mousemove", () => {
    const [xCoord, yCoord] = d3.mouse(svgHist.node());
    const top = yCoord > height - margin.bottom;
    const hoverSecs = x2.invert(xCoord);
    const hoverBin = hoverSecs - hoverSecs % binsize;
    let xPosition = x2(hoverBin + binsize) //d3.mouse(this)[0] - ttWidth/2;
    let yPosition = y3(0)+20 //d3.mouse(this)[1] - (ttHeight + 5);
    let pctLess = filterdata.filter(e=>+e.timebin<=hoverBin)
                            .reduce((sum, e) => sum += +e.count, 0) /
                  recordnumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                            .reduce((sum, d) => sum += +d.count, 0)
    const binCount = filterdata.filter(d=>d.timebin==hoverBin)[0].count
    bar
      .transition()
      .duration(150)
      .ease(d3.easeLinear)
      .style("fill", d=> +d.timebin <= +hoverBin ? "#cff" : "#fcc")
      .style("stroke","gray")

    tooltip.setPosition(xPosition, yPosition);
    tooltip.setText(d3.format(",")(hoverBin + binsize) + " seconds")
    counttip.setPosition(x2(0)-10, y2(+binCount) + 0*ttHeight/2)
    counttip.setText(d3.format(",")(+binCount))
    const isLow = (hoverBin/(binsize*numbins) < 0.2)
    const isHigh = (hoverBin/(binsize*numbins) > 0.8)
    const yBump = isLow ? 30 : isHigh ? -30 : 0
    let prefix
    let suffix
    // unicode below is left arrow and right arrow, respectively.
    if (isLow) {lessThanTip.setAlign("start"); prefix = "\u2190"} else {lessThanTip.setAlign("end"); prefix = ""}
    if (isHigh) {moreThanTip.setAlign("end"); suffix = "\u2192"} else {moreThanTip.setAlign("start"); suffix = ""}
    
    moreThanTip.setPosition(xPosition, y3(0.5) + yBump)
    moreThanTip.setText(parseFloat(100*(1-pctLess)).toFixed(2) + "%" + suffix)
    lessThanTip.setPosition(xPosition, y3(0.5) - yBump)
    lessThanTip.setText(prefix + parseFloat(100*pctLess).toFixed(2) + "%")
    hoverLine.transition().duration(50)
      .attr("x1", xPosition)
      .attr("x2", xPosition)
    countLine.transition().duration(50)
      .attr("x2", xPosition + x2(3*binsize) - x2(0))
      .attr("y1", y2(+binCount))
      .attr("y2", y2(+binCount))
  })

}

async function makeHist() {
  //console.log(width, height)
  let histMode = true //histogram or cdf display
  //const svg = d3.select("#histogram").append("svg").style("width", "100%"); //DOM.svg(width, height));
  
  let filterdata = await fd(dataSets);

 let y2 = d3.scaleLinear()
   .domain([0, d3.max(filterdata, d => +d.count)]).nice()
   .range([height - margin.bottom, margin.top])
 let yAxis2 = g => g
   .attr("transform", `translate(${margin.left},0)`)
   .call(d3.axisLeft(y2))
   //.call(g => g.select(".domain").remove())
   .call(g => g.select(".tick:last-of-type text").clone()
       .attr("x", 4)
       .attr("text-anchor", "start")
       .attr("font-weight", "bold")
       .text(dataSets.count))
 let yAxis3 = g => g
   .attr("transform", `translate(${window.innerWidth-margin.right},0)`)
   .call(d3.axisRight(y3))
   //.call(g => g.select(".domain").remove())
   .call(g => g.select(".tick:last-of-type text").clone()
       .attr("x", 4)
       .attr("text-anchor", "start")
       .attr("font-weight", "bold")
       .text(dataSets.count))

  const countLine = svgHist.append("line")
    .attr('x1', x2(-10))
    .attr('y1', y2(0))
    .attr('x2', x2(100))
    .attr('y2', y2(0)) //margin.top)
    .style("stroke-width", 2)
    .style("stroke", "green")
    .style("fill", "none")
    .style("display", "none")
    .attr("id", "countLine");
 
//   const bar = gBar
//     .selectAll("rect")
//     .data(filterdata)
//     .enter().append("rect")
//   //.style("fill", d=> d.timebin<300 ? "#353" : d.timebin<600? "#992" : "#a55")
//     .attr("x", d => x2(d.timebin) +1  )
//     .attr("width", d => x2(.975*binsize)-x2(.025*binsize))
//     .attr("y", d => y2(d.count))
//     .attr("height", d => y2(0) - y2(d.count))
//  
//   const cdf = await cdfs
//   let serie =gPath 
//     .selectAll("g")
//     .data(cdf.filter(d=>d.month=="").filter(d=>d.icg==fireCat))
//     .enter().append("g");
//   
//   serie.append("path")
//       .attr("fill", "none")
//       .style("stroke-width", d => (+d.CD==+cd) ? 5 : 0.5)
//       .attr("stroke-linejoin", "round")
//       .attr("stroke-linecap", "round")
//       .style("stroke", d => (+d.CD==+cd) ? "#fcf" : "#ddd")
//       .attr("d", d => linea(d.cdf||0))
//       .style("display", d => +cd == "" ? null : +cd%100 ? 
//                                 (+d.CD%100 ? null : "none") :
//                                 (+d.CD >= +cd && +d.CD < (+cd + 100) ? 
//                                    null  : "none"));

//    const recordnumbers = await recordNumbers
//    const totalcalls = recordnumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
//                        .reduce((sum, d) => sum += +d.count, 0);
  
//  try {
//   const medobj = (await nycCD).features.filter(d=>+d.properties.boro_cd==+cd)[0]
//                     .properties.median[agency][fireCat]
//   const median = medobj.length ? medobj[0].median : NaN
//    const median = nycCD.features.filter(d=>+d.properties.boro_cd==+cd)[0]
//                    .properties.median[agency][fireCat][0]
//                    .median; 
//   }
// catch (e) {
//    const median = NaN
//    }
  
  //console.log(median)
  
//    const ninetyPct = await quantileFromHistogram(pct, filterdata, cd, fireCat);
//    const average = recordnumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
//                      .reduce((sum, d) => sum += +d.count * +d.avg, 0)/totalcalls

//   totaltip.setText(d3.format(",")(totalcalls) + " total calls")
//   totaltip.setPosition(x2(binsize*numbins),y3(0.9))
//   totaltip.setVisibility("none")
 
  const average = 20
  const ninetyPct = 0
  const median = 10
  const hoverLine = svgHist.append("line")
      .attr('x1', x2(0))
      .attr('y1', y3(0))
      .attr('x2', x2(0))
      .attr('y2', y3(1)) //margin.top)
      .attr("pointer-events", "none")
      .style("stroke-width", 4)
      .style("stroke", "black")
      .style("fill", "none")
      .style("display", "none")
      .attr("id", "hoverLine");
  
  const medianLine = svgHist.append("line")
      .style("stroke-width", 4)
      .style("stroke", "orange")
      .style("fill", "none")
      .attr("id", "medianLine");
  
  const averageLine = svgHist.append("line")
      .style("stroke-dasharray", ("20, 10"))
      .style("stroke-width", 4)
      .style("stroke", "blue")
      .style("fill", "none")
      .attr("id", "averageLine");
  
  const ninetyLine = svgHist.append("line")
      .style("stroke-width", 4)
      .style("stroke", "red")
      .style("fill", "none")
      .attr("id", "ninetyLine");
    
  const medianNote = svgHist.append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('x', x2(median))
      .attr('align', 'right')
      .attr('text-anchor', (pct>0.45 & pct<0.55)? 'end':'start')
      .attr('transform', `translate(0,${y3(0.5)})`)
      .attr("fill","black")
      .attr("dy", "1.2em")
      .attr("dx", `${0.2 * ((pct>0.45 & pct<0.55)?-1:1)}em`)
      .text(`${"Median = " + median + " seconds"}`)
      .attr("id", "medianNote");
  
  const averageNote = svgHist.append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '14px')
      .attr('x', x2(average))
      .attr('transform', `translate(0,${y3(1)})`)
        .attr("fill","black")
      .attr("dy", "1.2em")
      .attr("dx", "0.2em")
      .text(`Average = ${Math.round(average)} seconds`)
      .attr("id", "averageNote");
  
  const ninetyNote = svgHist.append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '14px')
      .attr('x', Math.min(x2(binsize*numbins),x2(ninetyPct)))
      .attr('align', 'right')
      .attr('text-anchor', (x2(ninetyPct) > (window.innerWidth-240))? 'end':'start')
      .attr('transform', `translate(0,${Math.max(Math.min(y3(0.1),y3(pct)),y3(0.9))})`)
      .attr("fill","black")
      .attr("dy", "1.2em")
      .attr("dx", `${0.2 * ((x2(ninetyPct) < (window.innerWidth-240))?1:-1)}em`)
      .text(`${Math.round(pct*100)}${ordinalSuffix(Math.round(pct*100))} Percentile ` + (ninetyPct > binsize*numbins ? `more than ${binsize*numbins} seconds`: `= ${ninetyPct} seconds`))
      .attr("id", "ninetyNote");
  
//   const indicators = [ninetyNote, ninetyLine, medianNote, medianLine, averageNote, averageLine, serie]
//   const tips = [tooltip, counttip, moreThanTip, lessThanTip, totaltip]
  
  const timeAxis = svgHist.append("g")
      .attr('class', "xAxis")
  
  timeAxis.call(xAxis)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr("transform",`translate(${(window.innerWidth - margin.left - margin.right)/2 + margin.left}, 30)`)
      .attr("fill","black")
      .attr("align","center")
      .style("text-anchor", "middle")
      .text('incident response time (seconds)');
  
  const countAxis = svgHist.append("g")
      .attr('class', "yAxis1")
  
  countAxis.call(yAxis2)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .text('number of calls')
      .attr("align","center")
      .attr("transform",`rotate(-90)translate(-35, -50)`)  
      .attr("fill","black")
  
  const cdfAxis = svgHist.append("g")
      .attr('class', "yAxis2")
  
  cdfAxis.call(yAxis3)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .text('cumulative portion of calls')
      .attr("align","center")
      .style("text-anchor", "middle")
      .attr("transform",`rotate(90)translate(${height/2-margin.top},-30)`)  
      .attr("fill","black")
  
  updateHist()
}

async function makeMap(theData){

  // Construct container for the map as in the Observable Leaflet demo
  //let container = DOM.element('div', { style: `width:100%;height:100%` });
  //yield container;
  
  // Center the map on NYC and set the zoom level.
  let bounds = L.latLngBounds(L.latLng(40.2, -74.5), L.latLng(41.2, -73.4));
  let map = L.map("map-container", { intertia:false, maxBounds: bounds }).setView([40.703312, -73.97968], 10);
  map.setMinZoom( map.getBoundsZoom( map.options.maxBounds ) )
  
  // Boolean that controls whether the view is locked on click.
  let hoverOn = true;
  
  // Get map layers from NYC DoITT GIS tile server
  var baseLayer = L.tileLayer('https://maps{s}.nyc.gov/xyz/1.0.0/carto/basemap/{z}/{x}/{y}.jpg', {
    minNativeZoom: 8,
    maxNativeZoom: 19,
    subdomains: '1234',
    attribution: "map tiles <a href='https://maps.nyc.gov/tiles/'>\u00A9 City of New York</a> (<a href='https://creativecommons.org/licenses/by/4.0/'>CC BY 4.0</a>)",
    bounds: L.latLngBounds([39.3682, -75.9374], [42.0329, -71.7187])
  });
  map.addLayer(baseLayer);

  // Use leaflet layer demo code to get NYC labels on top of the d3 paths.
  map.createPane('labels');
  var labelLayer = L.tileLayer('https://maps{s}.nyc.gov/xyz/1.0.0/carto/label/{z}/{x}/{y}.png8', {
    minNativeZoom: 8,
    maxNativeZoom: 19,
    subdomains: '1234',
    bounds: L.latLngBounds([40.0341, -74.2727], [41.2919, -71.9101]),
    pane: 'labels'
  });
  map.addLayer(labelLayer);
  //map.getPane('labels').style.zIndex = 650;
  map.getPane('labels').interactive = false;
  map.getPane('labels').style.pointerEvents = 'none';
  
  // We need two svg elements, one which contains the path group on the overlay pane that will be transformed,
  // and one which contains the elements that should stay in place on pan/zoom (legend and borough selectors)
  // on the popup pane (which by default sits at the top layer, including over the labels).
  let opane = d3.select(map.getPanes().overlayPane)
  let svg = opane.append("svg").style("pointer-events","painted")
        .attr('width', '100%')
        .attr('height', '100%')
  let g = svg.append("g").attr("class", "leaflet-zoom-hide") //.style("pointer-events", "auto");
//  map.getPanes().popupPane.interactive = false;

  //let ppane = d3.select("#map-controls").append("svg") //d3.select(map.getPanes().popupPane)
  //let ppane = d3.select("body").selectAll(".leaflet-control-container").append("div").attr("class", "my-control-container").append("svg")
  let ppane = d3.select("body").selectAll(".leaflet-top").filter('.leaflet-left')
      .append("div").attr("class", "my-control-container")
      .append("svg")
      .style("pointer-events","none")
      .attr('width', '100%') //width)
      .attr('height', '100%') //width)
      .style('zIndex', "1000")
 let svg2 = ppane.append("g")
      .style("pointer-events","none")
      //.style('width', '100%') //width)
      //.style('height', '100%') //width)
  
  // Custom transform between map coordinates and d3 coordinates
  var transform = d3.geoTransform({point: projectPoint})
  let ppath = d3.geoPath().projection(transform);
  
  // The legend group is added to our static svg element
  let legend = svg2.append('g')
    .attr("class", "key")
    .attr("width", 500)
    .attr("transform", `translate(25, ${window.innerHeight - 35})`) //Width/2.5-35})`) // + width/1.6 - 200 + ")")
  
  legend.append('rect')
    .attr('width', 300)
    .attr('height', 50)
    .attr('fill', '#eee')
    .style('fill-opacity', 0.92)
    .attr('transform', `translate(-20, -20)`)
    .attr("id", "legend")
  
  legend.append('g').attr("id", "legendIndicators").selectAll("rect")
    .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = legendX.domain()[0];
      if (d[1] == null) d[1] = legendX.domain()[1];
      return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .style('fill-opacity', 0.5)
    .attr("x", function(d) { return legendX(d[0]); })
    .attr("width", function(d) { return legendX(d[1]) - legendX(d[0]); })
    .attr("fill", function(d) { return color(d[0]); })

  legend.append("text")
    .attr("class", "caption")
    .attr("x", legendX.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("transform", "translate(0,0)")
    .attr("font-weight", "bold")
    .text("Median response time (seconds)");
  
  legend.call(d3.axisBottom(legendX)
    .tickSize(13)
    .tickValues(d3.range(...domains[agency], 50)))
  .select(".domain")
    .remove();
  
  // The geometry "popup"
  const cdDescriptor = svg2.append('g')
    .attr("transform", `translate(${window.innerWidth*0.05},10)`)
    .style("display", "none")
    .style("pointer-events", "none")
    .attr("fill-opacity", 0.25)
  cdDescriptor.append("rect")
    .attr("fill-opacity", 0.25)
    .attr("width", window.innerWidth*0.9)
    .attr("height", 50)
    .attr("fill", "#ddd")
  cdDescriptor.append("text")
    .text("")
    .attr("transform", `translate(${window.innerWidth*0.45},35)`)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
  
  // The borough selection boxes should stay in place in the container, so add it to the static svg element.
  const boroboxes = svg2.append('g')
    .attr("transform", "translate(20,50)")
    .selectAll("rect")
    .data(boroData)
    .enter()
  boroboxes.append("rect")
      .attr("pointer-events","fill")
      .attr("width", 100)
      .attr("y", d => d.CD*.4)
      .attr("height", 30)
      .call(boxColor)
      .moveToFront()
      //.attr("pointer-events","painted")
      .on("click", function(d){
        cd = d.CD
        updateHist();
        hoverOn = false;
        g.selectAll('path').transition(t).call(reColor)
        g.selectAll('path')
            .filter(function(e) {return (e.properties.boro_cd > +d.CD & e.properties.boro_cd < +d.CD + 100) })
            .transition(t).call(selectColor)
        boroboxes.selectAll("rect").transition(t).call(boxColor)
        d3.select(this).transition(t).call(selectColor)
        d3.event.stopPropagation()
          })   
      .on("mouseover", function(d) {
        if (hoverOn) {
          d3.select(this)
            .transition(t)
              .call(selectColor);
          cd = d.CD;
          updateHist()
          g.selectAll('path')
            .filter(function(e) {return (e.properties.boro_cd > +d.CD & e.properties.boro_cd < +d.CD + 100) })
            .transition(t)
              .call(selectColor)
        }})
      .on("mouseout", 
          function(d) { if (hoverOn) {
            d3.select(this)
              .transition(t)
              .call(boxColor);
        cd = "";
        updateHist()
        g.selectAll('path')
          .transition(t)
            .call(reColor)
  }});  
  boroboxes.append("text")
      .text(d => d.borough)
      .attr("transform", "translate(50)")
      .attr("y", d => d.CD*.4 + 15 + 6)
      .attr('pointer-events', 'none')
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");
  
  const CDdata = await theData
  const cdnames = await cdNames
    // The geometries need to be transformed, so add them to the group on the transforming svg element.
  const features = g.selectAll('path')
    .data(CDdata.features)
    .enter()
      .append('path')
      .style('fill-opacity', 0.5)
      .call(reColor)
      .attr('d', ppath)
      .style("pointer-events","fill")
    .on("click", function(d){
        cd = d.properties.boro_cd
        updateHist()
        hoverOn = false;    // When clicking a path, turn off hover events
        g.selectAll('path').transition(t).call(reColor)
        boroboxes.selectAll('rect').transition(t).call(boxColor)
        d3.select(this).moveToFront().transition(t).call(selectColor)
        d3.event.stopPropagation()    // Prevent event from bubbling up to the map (which would undo this click)
          })   
    .on("mouseenter", 
        function(d){
          if(hoverOn){
            if (cd != d.properties.boro_cd){
              cd = d.properties.boro_cd  
              d3.select(this)
                .moveToFront()
                .transition(t)
                  .call(selectColor)
              fdnyLocs.moveToFront()
              let cdInfo = cdnames.filter(e=>+e.cdNumber==d.properties.boro_cd)[0]
              cdDescriptor.selectAll("text").text(
                cdInfo.Borough + " Community District " + cdInfo.bcdNumber + ": " + cdInfo.cdName)
              cdDescriptor.style("display", null)
              cdDescriptor.transition(t).style("fill-opacity", 1)
              updateHist()
    }}})       
    .on("mouseleave", 
        function(d){ if(hoverOn){
          d3.select(this)
            .transition(t)
              .call(reColor)
          //updateHist()
        }
  });
  
  const fdnyLocs = g.selectAll('circle')
		.data(fdnyLocations).enter()
		.append("circle")
		.attr("r", "3px")
		.attr("fill", "#696")
    .attr("fill-opacity", 0.9)
    .style("display", "none") //showFDNYLocations ? "inherit" : "none")
    .attr("transform", 
				function(d) { 
					return "translate("+ 
						map.latLngToLayerPoint(d.LatLng).x +","+ 
						map.latLngToLayerPoint(d.LatLng).y +")";})
    .on("mouseenter", () => {L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
                             tooltip.style("display", null);})
    .on("mouseleave", () => {L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
                             tooltip.style("display", "none");})
    .on("mousemove", function(d) {
        //console.log(d)
        var xPosition = d3.mouse(this)[0] - ttWidth/2;
        var yPosition = d3.mouse(this)[1] - (ttHeight + 5);
        tooltip.attr("transform", "translate(" + 
            map.latLngToLayerPoint(d.LatLng).x +","+ 
						map.latLngToLayerPoint(d.LatLng).y +")")
        tooltip.select("text").text(d.FacilityName)
        tooltip.moveToFront()
    })

  let ttWidth = 100, ttHeight=50
  const tooltip = g.append("g")
    .attr("class", "tooltip")
    .style("display", null)

  tooltip.append("text")
    .attr('font-family', 'sans-serif')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr('fill', '#422')
    //.attr('stroke-width', '0.75px')
    //.attr('stroke', 'white')
    .attr("x", 0)
                             
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
  
  // In hover mode, set geometry selector to none when mouse leaves all paths.
  g.on("mouseleave", function(d){if (hoverOn) {
    cd = ""
    cdDescriptor.transition(t).style("fill-opacity", 0.001)
    cdDescriptor.style("display", "none")
    cdDescriptor.selectAll("text").text("")
    updateHist();
  }})
  
  // Turn hover mode back on when clicking anywhere in the map (ignored when clicked in paths
  // because we prevented the click from bubbling up.
  map.on("click", () => { 
    cd = ""; 
    hoverOn = true;
    g.selectAll('path').transition(t).call(reColor)
    boroboxes.selectAll('rect').transition(t).call(boxColor)
    cdDescriptor.selectAll("text").text("")
    cdDescriptor.transition(t).style("fill-opacity", 0.001);
    updateHist();
  })
  map.on("viewreset zoom", reset);
 // map.on("move", (e) => { //debugger;
 //   svg2.attr("transform",
 //             "translate(" + -e.target.dragging._lastPos.x + "," + 
 //             -e.target.dragging._lastPos.y + ")");  })
  
  //map.on("move", (e) => legend.attr("transform", "translate(" + e.)
  
  reset();
  
  ////////////////////////////////////////
  function reset() {
    var bounds = ppath.bounds(CDdata),
        topLeft = bounds[0],
        bottomRight = bounds[1];
    
    svg .attr("width", bottomRight[0] - topLeft[0])
        .attr("height", bottomRight[1] - topLeft[1])
        .style("left", topLeft[0] + "px")
        .style("top", topLeft[1] + "px");

    g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
    g   .selectAll('path').attr("d", ppath);
    fdnyLocs.attr("transform", 
				function(d) { 
					return "translate("+ 
						map.latLngToLayerPoint(d.LatLng).x +","+ 
						map.latLngToLayerPoint(d.LatLng).y +")";})
    //opane.moveToFront()
    //ppane.moveToFront()

  }

  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
}
  
//TODO: Re-add the fdny location toggle
/*      
name: "viewof showFDNYLocations",
      inputs: ["checkbox"],
      value: (function(checkbox){return(
checkbox({
  options: [
    { value: 'toggle', label: 'Show FDNY companies on map' }
  ]//,
  //value: 'toggle'
})
)})
    },
    {
      name: "showFDNYLocations",
      inputs: ["Generators","viewof showFDNYLocations"],
      value: (G, _) => G.input(_)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
      */

// Here be cells from Observable from when this was a live download
/*
 * name: "setCode",
      value: (function(){return(
new Object({FDNY: 'mhu7-c3xb', EMS: '66ae-7zpy'})
)})
    },
    {
      name: "queries",
      inputs: ["binsizes","numbins"],
      value: (function(binsizes,numbins){return(
new Object(
        {FDNY: 
          `SELECT 
             (incident_response_seconds_qy - incident_response_seconds_qy % ${binsizes.FDNY}) AS timebin,
             date_trunc_ym(incident_datetime) as month,
             communitydistrict AS CD,
             incident_classification_group AS icg,
             COUNT(*) AS count
           WHERE ((timebin < ${(binsizes.FDNY * numbins) + 1}) AND (valid_incident_rspns_time_indc = 'Y') AND icg in("Structural Fires", "NonStructural Fires", "Medical Emergencies", "NonMedical Emergencies"))
           GROUP BY timebin, icg, communitydistrict, month
           ORDER BY communitydistrict, icg, timebin
           LIMIT 500000`,
         EMS:
           `SELECT 
             (incident_response_seconds_qy - incident_response_seconds_qy % ${binsizes.EMS}) AS timebin, 
             date_trunc_ym(incident_datetime) as month,
             communitydistrict AS CD,
             CASE (initial_severity_level_code='1', 'Segment 1',
                   initial_severity_level_code between '1' and '3', 'Life-threatening',
                   1=1, 'Non-life-threatening') as icg,
             COUNT(*) AS count
           WHERE ((timebin < ${(binsizes.EMS * numbins) + 1}) AND (valid_incident_rspns_time_indc = 'Y'))
           GROUP BY timebin, icg, communitydistrict, month
           ORDER BY communitydistrict, icg, timebin
           LIMIT 500000`
        })
)})
    },
    {
      name: "getData",
      inputs: ["consumer","setCode","queries"],
      value: (function(consumer,setCode,queries){return(
function(theAgency) {
  return new Promise((resolve, reject) => { 
  consumer.query()
    .withDataset(setCode[theAgency])
    .soql(queries[theAgency])
    .getRows()
      .on('success', function(rows){ resolve(rows); })
      .on('error', function(error) { reject(error); })
})}
)})
    },
    {
      name: "dataSets",
      inputs: ["agencies","getData"],
      value: (function(agencies,getData){return(
Promise.all(agencies.map(agcy=>getData(agcy))).then(
  function(results){
    return results.reduce(function(a,b){return a.concat(b);})
    /*console.log("i'm running too!")
    let r = {}
    for (let i = 0; i < agencies.length; i++) {
      r[agencies[i]] = results[i];
    }
    return r*/
/*
})
)})
    },
    {
      name: "dataSets2",
      inputs: ["d3","dataSets"],
      value: (function(d3,dataSets){return(
d3.nest().key(d=>d.CD)
                     .key(d=>d.icg)
                     .entries(dataSets)
                     .map(function(cdgroup){
                       return {CD:cdgroup.key, 
                               values:cdgroup.values.map(function(icggroup){
                                 return {icg: icggroup.key, 
                                         values:icggroup.values}})}})
)})
    },
    {
      name: "getNumQueries",
      value: (function(){return(
new Object(
        {FDNY: 
          `SELECT 
             communitydistrict AS CD,
             incident_classification_group AS icg,
             date_trunc_ym(incident_datetime) as month,
             COUNT(*) AS count,
             avg(incident_response_seconds_qy) as avg
           WHERE valid_incident_rspns_time_indc = 'Y' AND icg in("Structural Fires", "NonStructural Fires", "Medical Emergencies", "NonMedical Emergencies")
           GROUP BY icg, communitydistrict, month
           LIMIT 50000`,
         EMS:
           `SELECT 
             communitydistrict AS CD,
             date_trunc_ym(incident_datetime) as month,
             CASE (initial_severity_level_code='1', 'Segment 1',
                   initial_severity_level_code between '1' and '3', 'Life-threatening',
                   1=1, 'Non-life-threatening') as icg,
             COUNT(*) AS count,
             avg(incident_response_seconds_qy) as avg
           WHERE valid_incident_rspns_time_indc = 'Y'
           GROUP BY icg, communitydistrict, month
           LIMIT 80000`
        })
)})
    },
    {
      name: "getNumRecords",
      inputs: ["consumer","setCode","getNumQueries"],
      value: (function(consumer,setCode,getNumQueries){return(
function(theAgency) {
  return new Promise((resolve, reject) => { 
  consumer.query()
    .withDataset(setCode[theAgency]) //'66ae-7zpy')
    .soql(getNumQueries[theAgency])
    .getRows()
      .on('success', function(rows){ resolve(rows); })
      .on('error', function(error) { reject(error); })
})}
)})
    },
    {
      name: "recordNumbers",
      inputs: ["agencies","getNumRecords"],
      value: (function(agencies,getNumRecords){return(
Promise.all(agencies.map(theagency=>getNumRecords(theagency))).then(
  function(results){
    return [].concat(...results)
/*    console.log("i'm running three!")
    let r = {}
    for (let i = 0; i < agencies.length; i++) {
      r[agencies[i]] = results[i];
    }
    return r*/
/*  })
)})
    },
    {
      name: "trends",
      value: (function(){return(
[]
)})
    },
    {
      name: "cdfs",
      value: (function(){return(
[]
)})
    },
    {
      value: throw new SyntaxError("Unexpected token (1:3)")
    },
    {
      name: "nycCD",
      inputs: ["d3","dataSets2","agencies","recordNumbers","LLCategories","filterByCat","reduceByTimebin","quantileFromHistogram","cdfs","trends","dataSets","filterByCD2"],
      value: (function(d3,dataSets2,agencies,recordNumbers,LLCategories,filterByCat,reduceByTimebin,quantileFromHistogram,cdfs,trends,dataSets,filterByCD2){return(
d3.json('https://data.cityofnewyork.us/api/geospatial/yfnk-k7r4?method=export&format=GeoJSON')
  .then(async function (result) { 
  //  return await Promise.all(result.features.map(async (obj) => {
  //    await processCD(obj)

//    result.features.forEach(function(obj){
    for await(const obj of result.features){
      // for each agency...
//      let Recs = dataSets.filter(d => d.CD == obj.properties.boro_cd)
      let Recs = dataSets2.filter(d=>d.CD==obj.properties.boro_cd)[0].values
      //console.log(Recs)
      obj.properties.median = {}
      //obj.properties.histogram = {}
      for (let a of agencies) {
        obj.properties.median[a] = {} 
        //obj.properties.histogram[a] = {}
        let nn1 = recordNumbers.filter(d=>+d.CD==obj.properties.boro_cd)
        for (let fc of LLCategories[a]) {
          // for each feature, filter call data by feature CD

          let fRecs = Recs.filter(filterByCat, fc) // (d=>fc==d.icg)

          
          let nn2 = nn1.filter(filterByCat, fc)
          
          //obj.properties.histogram[a][fc] = {}
          obj.properties.median[a][fc] = []
          
          // get median and cdf for all months
          if (fRecs.length){
            fRecs = fRecs[0].values
            let fd = reduceByTimebin(fRecs)
            //console.log(fd)
            let nn = nn2.reduce((sum,d)=>sum + +d.count, 0) //.count
            
            let sum = 0;
            let theCDF = [];
            theCDF.push({timebin: 0, cdf: 0})
            //fRecs[0]['cdf'] = 0
            //console.log(fd)
            for(let i=0; i < fd.length-1; i++){
              sum += +(fd[i].count)
              theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});
            }
            
            obj.properties.median[a][fc].push({month: "", 
                                               median: quantileFromHistogram(0.5, 
                                                                             fd, 
                                                                             obj.properties.boro_cd, 
                                                                             fc)})
            cdfs.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: "", cdf: theCDF});
          }
          
          const theMonths = [...new Set(fRecs.map(item => item.month))].sort()
          let theTrend = [];
          for (let theMonth of theMonths){
            // further filter by month
            let fmRecs = fRecs.filter(d => d.month == theMonth)
            //console.log(fmRecs)
            let fd = reduceByTimebin(fmRecs) /*dataSets.filter(d => d.CD == obj.properties.boro_cd)
                                             .filter(filterByCat, fc)
                                             .filter(d => d.month == theMonth))*/
            //console.log(fd)
/*            if (fmRecs.length){
              //console.log(fmRecs)
              // then compute median from the resulting histogram
              const med = quantileFromHistogram(0.5, fd, obj.properties.boro_cd, fc, theMonth);
              theTrend.push({month: theMonth, median:med})
              //trends.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: theMonth, median: med});
              //console.log(nn2.filter(d=>d.month == theMonth))
/*              let nn = nn2.filter(d => d.month == theMonth)
                                       .reduce((sum,d)=>sum + +d.count, 0) //.count
              //if(obj.properties.boro_cd=="101" && fc=="Medical Emergencies" && theMonth==theMonths[0]) { console.log(fd, fmRecs, nn, theMonth) }
              let sum = 0;
              fmRecs[0]['cdf'] = 0
              let theCDF = [];
              theCDF.push({timebin: 0, cdf: 0})
              //console.log(fmRecs.length-1)
              for(let i=0; i < fd.length-1; i++){
                sum += +(fd[i].count)                
                fmRecs[i+1]['cdf'] = sum/nn;
                theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});
              //obj.properties.histogram[a][fc] = fRecs 
              } // for each record
              obj.properties.median[a][fc].push({month: theMonth, 
                                                 median: med});
              cdfs.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: theMonth, cdf: theCDF});
  */            
  /*            
            } // if records not empty 
          } // for each month 
          trends.push({agency: a, icg: fc, CD: obj.properties.boro_cd, trend: theTrend});
        } // for each firecat
      } // for each agency
    } // for each CD
    
    return result
    
    
  })
  .then(function(result) {
    //console.log(result)
    for(let iterCD = 0; iterCD <= 500; iterCD+=100){
      // for each agency...
      let idx = result.features.push({properties: {boro_cd: iterCD, 
                                                   median: {}, 
                                                   histogram: {} }})
      let obj = result.features[idx-1]
      for (let a of agencies) {
        obj.properties.median[a] = {}
        //result.features[obj-1].properties.histogram[a] = {}
        for (let fc of LLCategories[a]) {
          
          let fdata = dataSets.filter(filterByCD2, iterCD)
                              .filter(filterByCat, fc)
          let nn2 = recordNumbers.filter(filterByCD2, iterCD)
                                .filter(filterByCat, fc)

          //(d=>fc==d.icg)
          const theMonths = [...new Set(fdata.map(item => item.month))].sort()
          //obj.properties.histogram[a][fc] = {}
          //FIX THIS LINE
          //let fd = reduceByTimebin(fdata)

          if (fdata.length){
            let fd = reduceByTimebin(fdata)
            //console.log(fd)
            let nn = nn2.reduce((sum,d)=>sum + +d.count, 0) //.count
            
            let sum = 0;
            let theCDF = [];
            theCDF.push({timebin: 0, cdf: 0})
            //fRecs[0]['cdf'] = 0
            //console.log(fd)
            for(let i=0; i < fd.length-1; i++){
              sum += +(fd[i].count)
              theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});
            }

          
          obj.properties.median[a][fc] = []
          obj.properties.median[a][fc].push({month: "", 
                                             median: quantileFromHistogram(0.5, 
                                                                           fd, 
                                                                           obj.properties.boro_cd, fc)});

          cdfs.push({agency: a, icg: fc, CD: iterCD, month: "", cdf: theCDF});
          }
          
          let theTrend = [];

          for (let theMonth of theMonths){
            // further filter by month
            let fmRecs = fdata.filter(d => d.month == theMonth)
            let fd = reduceByTimebin(fmRecs) /*dataSets.filter(d => d.CD == obj.properties.boro_cd)
                                             .filter(filterByCat, fc)
                                             .filter(d => d.month == theMonth))*/
/*            //console.log(fd)
            if (fmRecs.length){
              //console.log(fmRecs)
              // then compute median from the resulting histogram
              const med = quantileFromHistogram(0.5, fd, obj.properties.boro_cd, fc, theMonth);

              obj.properties.median[a][fc].push({month: theMonth, median: med});
              theTrend.push({month: theMonth, median:med})
              //let median = quantileFromHistogram(0.5, fdata, iterCD)
              //obj.properties.median[a][fc] = median
/*
              let nn = nn2.filter(d => d.month == theMonth)
                                       .reduce((sum,d)=>sum + +d.count, 0)
              //console.log(iterCD, fc, nn, median, fdata)
              let sum = 0;
              let theCDF = [];
              theCDF.push({timebin: 0, cdf: 0})
              fdata[0]['cdf'] = 0
              for(let i=0; i < fd.length-1; i++){
                sum += +fd[i].count
                //console.log(iterCD, fc, fdata.length, sum, nn, sum/nn)
                fdata[i+1]['cdf'] = sum/nn;
                theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});}
              cdfs.push({agency: a, icg: fc, CD: iterCD, month: theMonth, cdf: theCDF});
*/
/*              //result.features[obj-1].properties.histogram[a][fc] = fdata
            } // if records not empty
          } // for each month */
/*          trends.push({agency: a, icg: fc, CD: iterCD, trend: theTrend});
        } // for each firecat
      } // for each agency
    } // for each boro/citywide
    return result
    })
)})
    },
    {
      name: "processCD",
      inputs: ["dataSets","agencies","recordNumbers","LLCategories","filterByCat","reduceByTimebin","quantileFromHistogram","cdfs","trends"],
      value: (function(dataSets,agencies,recordNumbers,LLCategories,filterByCat,reduceByTimebin,quantileFromHistogram,cdfs,trends){return(
async (obj) => {
//    result.features.forEach(function(obj){
      // for each agency...
      let Recs = dataSets.filter(d => d.CD == obj.properties.boro_cd)
      
      obj.properties.median = {}
      //obj.properties.histogram = {}
      for (let a of agencies) {
        obj.properties.median[a] = {} 
        //obj.properties.histogram[a] = {}
        let nn1 = recordNumbers.filter(d=>+d.CD==obj.properties.boro_cd)
        for (let fc of LLCategories[a]) {
          // for each feature, filter call data by feature CD
          let fRecs = Recs.filter(filterByCat, fc) // (d=>fc==d.icg)

          let nn2 = nn1.filter(filterByCat, fc)
          const theMonths = [...new Set(fRecs.map(item => item.month))].sort()
          //obj.properties.histogram[a][fc] = {}
          obj.properties.median[a][fc] = []
          
          // get median and cdf for all months
          if (fRecs.length){
            let fd = reduceByTimebin(fRecs)
            //console.log(fd)
            let nn = nn2.reduce((sum,d)=>sum + +d.count, 0) //.count
            
            let sum = 0;
            let theCDF = [];
            theCDF.push({timebin: 0, cdf: 0})
            //fRecs[0]['cdf'] = 0
            //console.log(fd)
            for(let i=0; i < fd.length-1; i++){
              sum += +(fd[i].count)
              theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});
            }
            
            obj.properties.median[a][fc].push({month: "", 
                                               median: quantileFromHistogram(0.5, 
                                                                             fd, 
                                                                             obj.properties.boro_cd, 
                                                                             fc)})
            cdfs.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: "", cdf: theCDF});
          }
          
          let theTrend = [];
          for (let theMonth of theMonths){
            // further filter by month
            let fmRecs = fRecs.filter(d => d.month == theMonth)
            //console.log(fmRecs)
            let fd = reduceByTimebin(fmRecs) /*dataSets.filter(d => d.CD == obj.properties.boro_cd)
                                             .filter(filterByCat, fc)
                                             .filter(d => d.month == theMonth))*/
            //console.log(fd)
/*            if (fmRecs.length){
              //console.log(fmRecs)
              // then compute median from the resulting histogram
              const med = quantileFromHistogram(0.5, fd, obj.properties.boro_cd, fc, theMonth);
              theTrend.push({month: theMonth, median:med})
              //trends.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: theMonth, median: med});
              //console.log(nn2.filter(d=>d.month == theMonth))
/*              let nn = nn2.filter(d => d.month == theMonth)
                                       .reduce((sum,d)=>sum + +d.count, 0) //.count
              //if(obj.properties.boro_cd=="101" && fc=="Medical Emergencies" && theMonth==theMonths[0]) { console.log(fd, fmRecs, nn, theMonth) }
              let sum = 0;
              fmRecs[0]['cdf'] = 0
              let theCDF = [];
              theCDF.push({timebin: 0, cdf: 0})
              //console.log(fmRecs.length-1)
              for(let i=0; i < fd.length-1; i++){
                sum += +(fd[i].count)                
                fmRecs[i+1]['cdf'] = sum/nn;
                theCDF.push({timebin: fd[i].timebin, cdf: sum/nn});
              //obj.properties.histogram[a][fc] = fRecs 
              } // for each record
              obj.properties.median[a][fc].push({month: theMonth, 
                                                 median: med});
              cdfs.push({agency: a, icg: fc, CD: obj.properties.boro_cd, month: theMonth, cdf: theCDF});
  */            
  /*            
            } // if records not empty 
          } // for each month 
          trends.push({agency: a, icg: fc, CD: obj.properties.boro_cd, trend: theTrend});
        } // for each firecat
      } // for each agency
  return obj;
}
)})
    },
    */

/*
 * name: "download",
      value: (function(){return(
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(content)], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
)})
    },
    {
      inputs: ["download","dataSets"],
      value: (function(download,dataSets){return(
download(dataSets, 'dataSets.json', 'text/plain')
)})*/

// These are imports that will need to be reintroduced.
/*
{
      inputs: ["md"],
      value: (function(md){return(
md`## Imports`
)})
    },
    {
      name: "d3",
      inputs: ["require"],
      value: (function(require){return(
    },
    {
      name: "L",
      inputs: ["require"],
      value: (function(require){return(
)})
    },
    {
      from: "@jashkenas/inputs",
      name: "slider",
      remote: "slider"
    },
    {
      from: "@jashkenas/inputs",
      name: "radio",
      remote: "radio"
    },
    {
      from: "@jashkenas/inputs",
      name: "select",
      remote: "select"
    },
    {
      from: "@jashkenas/inputs",
      name: "checkbox",
      remote: "checkbox"
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`#### Styling for leaflet layers (renders blank here, see code in cells)`
)})
    },
    {
      inputs: ["html","resolve"],
      value: (function(html,resolve){return(
html`<link href='${resolve('leaflet@1.2.0/dist/leaflet.css')}' rel='stylesheet' />`
)})
    },
    {
      inputs: ["html"],
      value: (function(html){return(
html`<style>
.leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-image-layer, .leaflet-pane > svg path, .leaflet-tile-container {
				pointer-events: visible;
			}
img.leaflet-tile{
    pointer-events: none;
}
.leaflet-container.crosshair-cursor-enabled {
    cursor:crosshair;
}
</style>`
)})
    },
  ]
};

const m1 = {
  id: "@jashkenas/inputs",
  variables: [
    {
      name: "slider",
      inputs: ["input"],
      value: (function(input){return(
function slider(config = {}) {
  let {value, min = 0, max = 1, step = "any", precision = 2, title, description, format, submit} = config;
  if (typeof config == "number") value = config;
  if (value == null) value = (max + min) / 2;
  precision = Math.pow(10, precision);
  return input({
    type: "range", title, description, submit, format,
    attributes: {min, max, step, value},
    getValue: input => Math.round(input.valueAsNumber * precision) / precision
  });
}
)})
    },
    {
      name: "radio",
      inputs: ["input","html"],
      value: (function(input,html){return(
function radio(config = {}) {
  let {value: formValue, title, description, submit, options} = config;
  if (Array.isArray(config)) options = config;
  options = options.map(o => typeof o === "string" ? {value: o, label: o} : o);
  const form = input({
    type: "radio", title, description, submit, 
    getValue: input => {
      const checked = Array.prototype.find.call(input, radio => radio.checked);
      return checked ? checked.value : undefined;
    }, 
    form: html`
      <form>
        ${options.map(({value, label}) => `
          <label style="display: inline-block; margin: 5px 10px 3px 0; font-size: 0.85em;">
           <input type=radio name=input value="${value}" ${value === formValue ? 'checked' : ''} style="vertical-align: baseline;" />
           ${label}
          </label>
        `)}
      </form>
    `
  });
  form.output.remove();
  return form;
}
)})
    },
    {
      name: "select",
      inputs: ["input","html"],
      value: (function(input,html){return(
function select(config = {}) {
  let {
    value: formValue,
    title,
    description,
    submit,
    multiple,
    size,
    options
  } = config;
  if (Array.isArray(config)) options = config;
  options = options.map(
    o => (typeof o === "object" ? o : { value: o, label: o })
  );
  const form = input({
    type: "select",
    title,
    description,
    submit,
    getValue: input => {
      const selected = Array.prototype.filter
        .call(input.options, i => i.selected)
        .map(i => i.value);
      return multiple ? selected : selected[0];
    },
    form: html`
      <form>
        <select name="input" ${
          multiple ? `multiple size="${size || options.length}"` : ""
        }>
          ${options.map(
            ({ value, label }) => `
            <option value="${value}" ${
              value === formValue ? "selected" : ""
            }>${label}</option>
          `
          )}
        </select>
      </form>
    `
  });
  form.output.remove();
  return form;
}
)})
    },
    {
      name: "checkbox",
      inputs: ["input","html"],
      value: (function(input,html){return(
function checkbox(config = {}) {
  let { value: formValue, title, description, submit, options } = config;
  if (Array.isArray(config)) options = config;
  options = options.map(
    o => (typeof o === "string" ? { value: o, label: o } : o)
  );
  const form = input({
    type: "checkbox",
    title,
    description,
    submit,
    getValue: input => {
      if (input.length)
        return Array.prototype.filter
          .call(input, i => i.checked)
          .map(i => i.value);
      return input.checked ? input.value : false;
    },
    form: html`
      <form>
        ${options.map(
          ({ value, label }) => `
          <label style="display: inline-block; margin: 5px 10px 3px 0; font-size: 0.85em;">
           <input type=checkbox name=input value="${value || "on"}" ${
            (formValue || []).indexOf(value) > -1 ? "checked" : ""
          } style="vertical-align: baseline;" />
           ${label}
          </label>
        `
        )}
      </form>
    `
  });
  form.output.remove();
  return form;
}
)})
    },
    {
      name: "input",
      inputs: ["html","d3format"],
      value: (function(html,d3format){return(
function input(config) {
  let {form, type = "text", attributes = {}, action, getValue, title, description, format, submit, options} = config;
  if (!form) form = html`<form>
	<input name=input type=${type} />
  </form>`;
  const input = form.input;
  Object.keys(attributes).forEach(key => {
    const val = attributes[key];
    if (val != null) input.setAttribute(key, val);
  });
  if (submit) form.append(html`<input name=submit type=submit style="margin: 0 0.75em" value="${typeof submit == 'string' ? submit : 'Submit'}" />`);
  form.append(html`<output name=output style="font: 14px Menlo, Consolas, monospace; margin-left: 0.5em;"></output>`);
  if (title) form.prepend(html`<div style="font: 700 0.9rem sans-serif;">${title}</div>`);
  if (description) form.append(html`<div style="font-size: 0.85rem; font-style: italic;">${description}</div>`);
  if (format) format = d3format.format(format);
  if (action) {
    action(form);
  } else {
    const verb = submit ? "onsubmit" : type == "button" ? "onclick" : type == "checkbox" || type == "radio" ? "onchange" : "oninput";
    form[verb] = (e) => {
      e && e.preventDefault();
      const value = getValue ? getValue(input) : input.value;
      if (form.output) form.output.value = format ? format(value) : value;
      form.value = value;
      if (verb !== "oninput") form.dispatchEvent(new CustomEvent("input"));
    };
    if (verb !== "oninput") input.oninput = e => e && e.stopPropagation() && e.preventDefault();
    if (verb !== "onsubmit") form.onsubmit = (e) => e && e.preventDefault();
    form[verb]();
  }
  return form;
}
)})
    },
    {
      name: "d3format",
      inputs: ["require"],
      value: (function(require){return(
)})
    }
  ]
};
*/
makeMap(nycCD);
makeHist();
