// URL: https://beta.observablehq.com/d/46e43adf74f9a8a9
// Title: ADD TRENDS: NYC emergency response times and Local Law 119
// Author: Chris Prince (@cmprince)
// Version: 5811
// Runtime version: 1

const m0 = {
  id: "46e43adf74f9a8a9@5811",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# ADD TRENDS: NYC emergency response times and Local Law 119`
)})
    },
    {
      name: "mytooltip",
      value: (function(){return(
class mytooltip {
  
    /*
  const tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("display", "none")
  
  
  tooltip.append("rect")
    .attr("width", ttWidth)
    .attr("height", ttHeight)
    .attr("fill", "white")
    .style("opacity", 0.5);

  tooltip.append("text")
    .attr('font-family', 'sans-serif')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr("x", ttWidth/2)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");
  */
  
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
)})
    },
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
    },
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
}
)
    },
    {
      name: "chart",
      inputs: ["d3","DOM","width","height","mytooltip","x2","y2","filterData","binsize","cdfs","fireCat","cd","linea","recordNumbers","filterByCD2","filterByCat","nycCD","agency","quantileFromHistogram","pct","numbins","y3","ordinalSuffix","xAxis","margin","yAxis2","yAxis3"],
      value: (function(d3,DOM,width,height,mytooltip,x2,y2,filterData,binsize,cdfs,fireCat,cd,linea,recordNumbers,filterByCD2,filterByCat,nycCD,agency,quantileFromHistogram,pct,numbins,y3,ordinalSuffix,xAxis,margin,yAxis2,yAxis3)
{
  //console.log(width, height)
  let histMode = true //histogram or cdf display
  const svg = d3.select(DOM.svg(width, height));
  
  const ttWidth = 200
  const ttHeight = 20
  
  const counttip = new mytooltip({context: svg, ttWidth: 50, align: "end"})
  const tooltip = new mytooltip({context: svg})
  const totaltip = new mytooltip({context: svg, align: "end", xoffset: 20})
  
  const countLine = svg.append("line")
    .attr('x1', x2(-10))
    .attr('y1', y2(0))
    .attr('x2', x2(100))
    .attr('y2', y2(0)) //margin.top)
    .style("stroke-width", 2)
    .style("stroke", "green")
    .style("fill", "none")
    .style("display", "none");
  
  const bar = svg.append("g")
    .style("fill", "gray")
    .selectAll("rect")
    .data(filterData)
    .enter().append("rect")
  //.style("fill", d=> d.timebin<300 ? "#353" : d.timebin<600? "#992" : "#a55")
    .attr("x", d => x2(d.timebin) +1  )
    .attr("width", d => x2(.975*binsize)-x2(.025*binsize))
    .attr("y", d => y2(d.count))
    .attr("height", d => y2(0) - y2(d.count))
 

  console.log(cdfs)
  let serie = svg.append('g')
    .selectAll("g")
    .data(cdfs.filter(d=>d.month=="").filter(d=>d.icg==fireCat))
    .enter().append("g");
  
  serie.append("path")
      .attr("fill", "none")
      .style("stroke-width", d => (+d.CD==+cd) ? 5 : 0.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("stroke", d => (+d.CD==+cd) ? "#fcf" : "#ddd")
      .attr("d", d => {console.log("hi", d.cdf); return linea(d.cdf||0) })
      .style("display", d => +cd == "" ? null : +cd%100 ? 
                                (+d.CD%100 ? null : "none") :
                                (+d.CD >= +cd && +d.CD < (+cd + 100) ? 
                                   null  : "none"));

  const lessThanTip = new mytooltip({context: svg, align: "end", xoffset: 10, fontsize: '40px'})
  const moreThanTip = new mytooltip({context: svg, align: "start", xoffset: 10, fontsize: '40px'})
  
  const totalcalls = recordNumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                      .reduce((sum, d) => sum += +d.count, 0)
  
  //try {
    const median = nycCD.features.filter(d=>+d.properties.boro_cd==+cd)[0].properties.median[agency][fireCat][0].median
  //  }
  //catch(e) {
  //  const median = 2000
  //  }
  
  const ninetyPct = quantileFromHistogram(pct, filterData, cd, fireCat);
  const average = recordNumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                    .reduce((sum, d) => sum += +d.count * +d.avg, 0)/totalcalls

  totaltip.setText(d3.format(",")(totalcalls) + " total calls")
  totaltip.setPosition(x2(binsize*numbins),y3(0.9))
  totaltip.setVisibility("none")
  
  const hoverLine = svg.append("line")
      .attr('x1', x2(0))
      .attr('y1', y3(0))
      .attr('x2', x2(0))
      .attr('y2', y3(1)) //margin.top)
      .attr("pointer-events", "none")
      .style("stroke-width", 4)
      .style("stroke", "black")
      .style("fill", "none")
      .style("display", "none");
  
  const medianLine = svg.append("line")
      .attr('x1', x2(median))
      .attr('y1', y3(0))
      .attr('x2', x2(median))
      .attr('y2', y3(0.5)) //margin.top)
      .style("stroke-width", 4)
      .style("stroke", "orange")
      .style("fill", "none");
  
  const averageLine = svg.append("line")
      .attr('x1', x2(average))
      .attr('y1', y2(0))
      .attr('x2', x2(average))
      .attr('y2', y3(1))
      .style("stroke-dasharray", ("20, 10"))
      .style("stroke-width", 4)
      .style("stroke", "blue")
      .style("fill", "none");
  
  const ninetyLine = svg.append("line")
      .attr('x1', x2(ninetyPct))
      .attr('y1', y2(0))
      .attr('x2', x2(ninetyPct))
      .attr('y2', y3(pct)) //margin.top+60)
      .style("stroke-width", 4)
      .style("stroke", "red")
      .style("fill", "none")
    
  const medianNote = svg.append("text")
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
  
  const averageNote = svg.append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '14px')
      .attr('x', x2(average))
      .attr('transform', `translate(0,${y3(1)})`)
        .attr("fill","black")
      .attr("dy", "1.2em")
      .attr("dx", "0.2em")
      .text(`Average = ${Math.round(average)} seconds`)
  
  const ninetyNote = svg.append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '14px')
      .attr('x', Math.min(x2(binsize*numbins),x2(ninetyPct)))
      .attr('align', 'right')
      .attr('text-anchor', (x2(ninetyPct) > (width-240))? 'end':'start')
      .attr('transform', `translate(0,${Math.max(Math.min(y3(0.1),y3(pct)),y3(0.9))})`)
      .attr("fill","black")
      .attr("dy", "1.2em")
      .attr("dx", `${0.2 * ((x2(ninetyPct) < (width-240))?1:-1)}em`)
      .text(`${Math.round(pct*100)}${ordinalSuffix(Math.round(pct*100))} Percentile ` + (ninetyPct > binsize*numbins ? `more than ${binsize*numbins} seconds`: `= ${ninetyPct} seconds`))
  
  const indicators = [ninetyNote, ninetyLine, medianNote, medianLine, averageNote, averageLine, serie]
  const tips = [tooltip, counttip, moreThanTip, lessThanTip, totaltip]
  
  const timeAxis = svg.append("g")
      .attr('class', "xAxis")
  
  timeAxis.call(xAxis)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr("transform",`translate(${(width - margin.left - margin.right)/2 + margin.left}, 30)`)
      .attr("fill","black")
      .attr("align","center")
      .style("text-anchor", "middle")
      .text('incident response time (seconds)');
  
  const countAxis = svg.append("g")
      .attr('class', "yAxis1")
  
  countAxis.call(yAxis2)
      .append("text")
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .text('number of calls')
      .attr("align","center")
      .attr("transform",`rotate(-90)translate(-35, -50)`)  
      .attr("fill","black")
  
  const cdfAxis = svg.append("g")
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
  
  if (cd%100) { serie.filter(d=>+d.cd==+cd).moveToFront() }
  
  svg.on("mouseover", () => {  
    const [xCoord, yCoord] = d3.mouse(svg.node());
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
  
  svg.on("mouseout", () => {
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
  
  svg.on("mousemove", () => {
    const [xCoord, yCoord] = d3.mouse(svg.node());
    const top = yCoord > height - margin.bottom;
    const hoverSecs = x2.invert(xCoord);
    const hoverBin = hoverSecs - hoverSecs % binsize;
    let xPosition = x2(hoverBin + binsize) //d3.mouse(this)[0] - ttWidth/2;
    let yPosition = height-20 //d3.mouse(this)[1] - (ttHeight + 5);
    let pctLess = filterData.filter(e=>+e.timebin<=hoverBin)
                            .reduce((sum, e) => sum += +e.count, 0) /
                  recordNumbers.filter(filterByCD2, cd).filter(filterByCat, fireCat) //(d=>fireCat==d.icg)
                            .reduce((sum, d) => sum += +d.count, 0)
    const binCount = filterData.filter(d=>d.timebin==hoverBin)[0].count
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
    if (isLow) {lessThanTip.setAlign("start"); prefix = `←`} else {lessThanTip.setAlign("end"); prefix = ""}
    if (isHigh) {moreThanTip.setAlign("end"); suffix = `→`} else {moreThanTip.setAlign("start"); suffix = ""}
    
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

  
  //svg.on("click", () => { histMode = !histMode; console.log(histMode) })
  
  d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  
  return svg.node();
}
)
    },
    {
      inputs: ["nycCD","cd"],
      value: (function(nycCD,cd){return(
nycCD.features.filter(d=>+d.properties.boro_cd==+cd) //[0].properties.median[agency][fireCat]
)})
    },
    {
      name: "map",
      inputs: ["DOM","width","L","d3","color","legendX","domains","agency","boroData","boxColor","mutable cd","t","reColor","selectColor","nycCD","cdNames","fdnyLocations","showFDNYLocations"],
      value: (function*(DOM,width,L,d3,color,legendX,domains,agency,boroData,boxColor,$0,t,reColor,selectColor,nycCD,cdNames,fdnyLocations,showFDNYLocations)
{
  // Construct container for the map as in the Observable Leaflet demo
  let container = DOM.element('div', { style: `width:100%;position:absolute;top:0;bottom:0` });
  yield container;
  
  // Center the map on NYC and set the zoom level.
  let bounds = L.latLngBounds(L.latLng(40.2, -74.5), L.latLng(41.2, -73.4));
  let map = L.map(container, { intertia:false, maxBounds: bounds }).setView([40.703312, -73.97968], 10);
  map.setMinZoom( map.getBoundsZoom( map.options.maxBounds ) )
  
  // Boolean that controls whether the view is locked on click.
  let hoverOn = true;
  
  // Get map layers from NYC DoITT GIS tile server
  var baseLayer = L.tileLayer('https://maps{s}.nyc.gov/xyz/1.0.0/carto/basemap/{z}/{x}/{y}.jpg', {
    minNativeZoom: 8,
    maxNativeZoom: 19,
    subdomains: '1234',
    attribution: "map tiles <a href='https://maps.nyc.gov/tiles/'>© City of New York</a> (<a href='https://creativecommons.org/licenses/by/4.0/'>CC BY 4.0</a>)",
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
  map.getPane('labels').style.zIndex = 650;
  map.getPane('labels').interactive = false;
  map.getPane('labels').style.pointerEvents = 'none';
  
  // We need two svg elements, one which contains the path group on the overlay pane that will be transformed,
  // and one which contains the elements that should stay in place on pan/zoom (legend and borough selectors)
  // on the popup pane (which by default sits at the top layer, including over the labels).
  let svg = d3.select(map.getPanes().overlayPane).append("svg").attr("pointer-events","auto")
  let g = svg.append("g").attr("class", "leaflet-zoom-hide");
  let svg2 = d3.select(map.getPanes().popupPane).append("svg")
      .attr('width', width)
      .attr('height', width)
      .style('zIndex', 1000)
      .attr("pointer-events","none")
  
  // Custom transform between map coordinates and d3 coordinates
  var transform = d3.geoTransform({point: projectPoint})
  let ppath = d3.geoPath().projection(transform);
  
  // The legend group is added to our static svg element
  let legend = svg2.append('g')
    .attr("class", "key")
    .attr("width", 500)
    .attr("transform", `translate(25, ${width/2.5-35})`) // + width/1.6 - 200 + ")")
  
  legend.append('rect')
    .attr('width', 300)
    .attr('height', 50)
    .attr('fill', '#eee')
    .style('fill-opacity', 0.92)
    .attr('transform', `translate(-20, -20)`)
  
  legend.append('g').selectAll("rect")
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
    .attr("transform", `translate(${width*0.05},10)`)
    .style("display", "none")
    .style("pointer-events", "none")
    .attr("fill-opacity", 0.25)
  cdDescriptor.append("rect")
      .attr("fill-opacity", 0.25)
      .attr("width", width*0.9)
      .attr("height", 50)
      .attr("fill", "#ddd")
  cdDescriptor.append("text")
    .text("")
    .attr("transform", `translate(${width*0.45},35)`)
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
      .attr("pointer-events","auto")
      .attr("width", 100)
      .attr("y", d => d.CD*.4)
      .attr("height", 30)
      .call(boxColor)
      .moveToFront()
      //.attr("pointer-events","painted")
      .on("click", function(d){
        $0.value = d.CD
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
          $0.value = d.CD;
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
        $0.value = ""; 
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
  
  // The geometries need to be transformed, so add them to the group on the transforming svg element.
  const features = g.selectAll('path')
    .data(nycCD.features)
    .enter()
      .append('path')
      .style('fill-opacity', 0.5)
      .call(reColor)
      .attr('d', ppath)
      .attr("pointer-events","auto")
    .on("click", function(d){
        $0.value = d.properties.boro_cd
        hoverOn = false;    // When clicking a path, turn off hover events
        g.selectAll('path').transition(t).call(reColor)
        boroboxes.selectAll('rect').transition(t).call(boxColor)
        d3.select(this).moveToFront().transition(t).call(selectColor)
        d3.event.stopPropagation()    // Prevent event from bubbling up to the map (which would undo this click)
          })   
    .on("mouseenter", 
        function(d){ if(hoverOn){
          $0.value = d.properties.boro_cd;
          d3.select(this)
            .moveToFront()
            .transition(t)
              .call(selectColor)
          fdnyLocs.moveToFront()
          let cdInfo = cdNames.filter(e=>+e.cdNumber==d.properties.boro_cd)[0]
          cdDescriptor.selectAll("text").text(
            cdInfo.Borough + " Community District " + cdInfo.bcdNumber + ": " + cdInfo.cdName)
          cdDescriptor.style("display", null)
          cdDescriptor.transition(t).style("fill-opacity", 1)
    }})       
    .on("mouseleave", 
        function(d){ if(hoverOn){
          d3.select(this)
            .transition(t)
              .call(reColor)}
  });
  
  const fdnyLocs = g.selectAll('circle')
		.data(fdnyLocations).enter()
		.append("circle")
		.attr("r", "3px")
		.attr("fill", "#696")
    .attr("fill-opacity", 0.9)
    .style("display", showFDNYLocations ? "inherit" : "none")
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
    $0.value = ""
    cdDescriptor.transition(t).style("fill-opacity", 0.001)
    cdDescriptor.style("display", "none")
    cdDescriptor.selectAll("text").text("")
  }})
  
  // Turn hover mode back on when clicking anywhere in the map (ignored when clicked in paths
  // because we prevented the click from bubbling up.
  map.on("click", () => { 
    $0.value = ""; 
    hoverOn = true;
    g.selectAll('path').transition(t).call(reColor)
    boroboxes.selectAll('rect').transition(t).call(boxColor)
    cdDescriptor.selectAll("text").text("")
    cdDescriptor.transition(t).style("fill-opacity", 0.001);})
  map.on("viewreset zoom", reset);
  map.on("move", (e) => { //debugger;
    svg2.attr("transform",
              "translate(" + -e.target.dragging._lastPos.x + "," + 
              -e.target.dragging._lastPos.y + ")");  })
  
  //map.on("move", (e) => legend.attr("transform", "translate(" + e.)
  
  reset();
  
  ////////////////////////////////////////
  function reset() {
    var bounds = ppath.bounds(nycCD),
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
  }
  
  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
  
}
)
    },
    {
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
md`The width of the bins in seconds.`
)})
    },
    {
      name: "binsizes",
      value: (function(){return(
new Object({FDNY: 15, EMS: 30})
)})
    },
    {
      name: "binsize",
      inputs: ["binsizes","agency"],
      value: (function(binsizes,agency){return(
binsizes[agency]
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`The number of bins to retrieve (covering a total period of \`binsize * numbins\`)`
)})
    },
    {
      name: "numbins",
      value: (function(){return(
60
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`This is a \`mutable\` cell containing the selected Community District number`
)})
    },
    {
      name: "initial cd",
      value: (function(){return(
""
)})
    },
    {
      name: "mutable cd",
      inputs: ["Mutable","initial cd"],
      value: (M, _) => new M(_)
    },
    {
      name: "cd",
      inputs: ["mutable cd"],
      value: _ => _.generator
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Collect some statistics on each community district`
)})
    },
    {
      name: "filterData",
      inputs: ["reduceByTimebin","dataSets","filterByCD2","cd","filterByCat","fireCat"],
      value: (function(reduceByTimebin,dataSets,filterByCD2,cd,filterByCat,fireCat){return(
reduceByTimebin(dataSets.filter(filterByCD2, cd).filter(filterByCat, fireCat))
)})
    },
    {
      name: "filterByCat",
      inputs: ["LLCategories"],
      value: (function(LLCategories){return(
function(d){
  /*if (this == "All")
    return LLCategories[agency].includes(d.icg);
  else*/ 
    if (LLCategories['FDNY'].includes(this)) //agency == "FDNY")
      return d.icg == this;
    else { 
      const idx = LLCategories['EMS'].indexOf(this)
      const includeCats = LLCategories['EMS'].slice(0,idx+1)
      return includeCats.includes(d.icg)}
}
)})
    },
    {
      name: "filterByCD2",
      value: (function(){return(
function(d){
  // to be passed in the callback with a parameter, which becomes 'this', e.g., 
  // when calling .filter(filterByCD, cd), cd becomes 'this'.
  return this ?
    (this % 100) ?
      +d.CD == this
    :
      (d.CD > +this) && (d.CD < (+this +100))
    :
      true;
}
)})
    },
    {
      name: "reduceByTimebin",
      value: (function(){return(
function(data){
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
)})
    },
    {
      name: "quantileFromHistogram",
      inputs: ["recordNumbers","filterByCD2","filterByCat","binsizes","revLLCats"],
      value: (function(recordNumbers,filterByCD2,filterByCat,binsizes,revLLCats){return(
function(q, data, thisCD, thisCat, thisMonth="") {
  //console.log('why am i running')
  let sum = 0;
  let numberInCD = recordNumbers
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
  
  try{
  // after this sum, 
  // data[i] is the bin after the median, 
  // data[i-1] is the bin with the median, and
  // data[i-2] is the bin before the median.
  //First determine the number of items the last bin caused the sum to go past the median
  const bsize = binsizes[revLLCats[thisCat]]
  const delta = sum - quantilePosition;
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
  const alpha = (leftEdge-Math.sqrt((1-gamma)*leftEdge**2+rightEdge**2*gamma))/(leftEdge-rightEdge)
  
  const inferred = Math.round(+data[i-1].timebin + alpha*bsize)

  //Fallback to a simple calculation if above fails
  return inferred || Math.round(+data[i].timebin - delta/data[i-1].count * bsize)
  } catch(err) {return NaN}
}
)})
    },
    {
      name: "ordinalSuffix",
      value: (function(){return(
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
)})
    },
    {
      name: "margin",
      value: (function(){return(
{top: 5, right: 50, bottom: 30, left: 80}
)})
    },
    {
      name: "height",
      value: (function(){return(
180
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`## Data`
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Here we construct the query using \`binsize\` and \`numbins.\`:`
)})
    },
    {
      name: "agencies",
      value: (function(){return(
['FDNY', 'EMS']
)})
    },
    {
      name: "LLCategories",
      value: (function(){return(
new Object({
  FDNY: ["Structural Fires", "NonStructural Fires", "Medical Emergencies", "NonMedical Emergencies"],
  EMS: ["Segment 1", "Life-threatening", "Non-life-threatening"]})
)})
    },
    {
      name: "revLLCats",
      inputs: ["LLCategories"],
      value: (function(LLCategories){return(
Object.keys(LLCategories).reduce((acc, propName) =>          
  LLCategories[propName].reduce((a, num) => {
    a[num] = propName;
    return a;
  }, acc), {})
)})
    },
    {
      name: "setCode",
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
  })
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
  })
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
      name: "nycCD",
      inputs: ["d3","dataSets","agencies","recordNumbers","LLCategories","filterByCat","reduceByTimebin","quantileFromHistogram","cdfs","trends","filterByCD2"],
      value: (function(d3,dataSets,agencies,recordNumbers,LLCategories,filterByCat,reduceByTimebin,quantileFromHistogram,cdfs,trends,filterByCD2){return(
d3.json('https://data.cityofnewyork.us/api/geospatial/yfnk-k7r4?method=export&format=GeoJSON')
  .then(function (result) { 
    result.features.forEach(function(obj){
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
            if (fmRecs.length){
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
              
            } // if records not empty 
          } // for each month 
          trends.push({agency: a, icg: fc, CD: obj.properties.boro_cd, trend: theTrend});
        } // for each firecat
      } // for each agency
    }) // for each CD
    return result})
  .then(function(result) {
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
            console.log(fd)
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
              //result.features[obj-1].properties.histogram[a][fc] = fdata
            } // if records not empty
          } // for each month */
          trends.push({agency: a, icg: fc, CD: iterCD, trend: theTrend});
        } // for each firecat
      } // for each agency
    } // for each boro/citywide
    return result
    })
)})
    },
    {
      name: "boroData",
      value: (function(){return(
[{'borough':'Manhattan', 'CD':'100'},
            {'borough':'Bronx', 'CD':'200'},
            {'borough':'Brooklyn', 'CD':'300'},
            {'borough':'Queens', 'CD':'400'},
            {'borough':'Staten Island', 'CD':'500'}]
)})
    },
    {
      name: "cdNames",
      inputs: ["d3"],
      value: (function(d3){return(
d3.csvParse(`Borough,bcdNumber,cdNumber,cdName,1970 Population,1980 Population,1990 Population,2000 Population,2010 Population
Bronx,1,201,"Melrose, Mott Haven, Port Morris",138557,78441,77214,82159,91497
Bronx,2,202,"Hunts Point, Longwood",99493,34399,39443,46824,52246
Bronx,3,203,"Morrisania, Crotona Park East",150636,53635,57162,68574,79762
Bronx,4,204,"Highbridge, Concourse Village",144207,114312,119962,139563,146441
Bronx,5,205,"University Hts., Fordham, Mt. Hope",121807,107995,118435,128313,128200
Bronx,6,206,"East Tremont, Belmont",114137,65016,68061,75688,83268
Bronx,7,207,"Bedford Park, Norwood, Fordham",113764,116827,128588,141411,139286
Bronx,8,208,"Riverdale, Kingsbridge, Marble Hill",103543,98275,97030,101332,101731
Bronx,9,209,"Soundview, Parkchester",166442,167627,155970,167859,172298
Bronx,10,210,"Throgs Nk., Co-op City, Pelham Bay",84948,106516,108093,115948,120392
Bronx,11,211,"Pelham Pkwy, Morris Park, Laconia",105980,99080,97842,110706,113232
Bronx,12,212,"Wakefield, Williamsbridge",135010,128226,129620,149077,152344
Bronx,26,226,Van Cortlandt Park,,,,,
Bronx,27,227,Bronx Park,,,,,
Bronx,28,228,Pelham Bay Park,,,,,
Brooklyn,1,301,"Williamsburg, Greenpoint",179390,142942,155972,160338,173083
Brooklyn,2,302,"Brooklyn Heights, Fort Greene",110221,92732,94534,98620,99617
Brooklyn,3,303,Bedford Stuyvesant,203380,133379,138696,143867,152985
Brooklyn,4,304,Bushwick,137902,92497,102572,104358,112634
Brooklyn,5,305,"East New York, Starrett City",170791,154931,161350,173198,182896
Brooklyn,6,306,"Park Slope, Carroll Gardens",138933,110228,102724,104054,104709
Brooklyn,7,307,"Sunset Park, Windsor Terrace",111607,98567,102553,120063,126230
Brooklyn,8,308,Crown Heights North,121821,88796,96400,96076,96317
Brooklyn,9,309,"Crown Heights South, Wingate",101047,96669,110715,104014,98429
Brooklyn,10,310,"Bay Ridge, Dyker Heights",129822,118187,110612,122542,124491
Brooklyn,11,311,"Bensonhurst, Bath Beach ",170119,155072,149994,172129,181981
Brooklyn,12,312,"Borough Park, Ocean Parkway",166301,155899,160018,185046,191382
Brooklyn,13,313,"Coney Island, Brighton Beach",97750,100030,102596,106120,104278
Brooklyn,14,314,"Flatbush, Midwood",137041,143859,159825,168806,160664
Brooklyn,15,315,"Sheepshead Bay, Gerritsen Beach",164815,149572,143477,160319,159650
Brooklyn,16,316,"Brownsville, Ocean Hill",122589,73801,84923,85343,86468
Brooklyn,17,317,"East Flatbush, Rugby, Farragut",149496,154596,161261,165753,155252
Brooklyn,18,318,"Canarsie, Flatlands",188643,169092,162428,194653,193543
Brooklyn,55,355,Prospect Park,,,,,
Brooklyn,56,356,Jamaica Bay (Brooklyn),,,,,
Manhattan,1,101,"Battery Park City, Tribeca",7706,15918,25366,34420,60978
Manhattan,2,102,"Greenwich Village, Soho",84337,87069,94105,93119,90016
Manhattan,3,103,"Lower East Side, Chinatown",181845,154848,161617,164407,163277
Manhattan,4,104,"Chelsea, Clinton",83601,82164,84431,87479,103245
Manhattan,5,105,Midtown Business District,31076,39544,43507,44028,51673
Manhattan,6,106,"Stuyvesant Town, Turtle Bay",122465,127554,133748,136152,142745
Manhattan,7,107,"West Side, Upper West Side",212422,206669,210993,207699,209084
Manhattan,8,108,Upper East Side,200851,204305,210880,217063,219920
Manhattan,9,109,"Manhattanville, Hamilton Heights",113606,103038,106978,111724,110193
Manhattan,10,110,Central Harlem,159267,105641,99519,107109,115723
Manhattan,11,111,East Harlem,154662,114569,110508,117743,120511
Manhattan,12,112,"Washington Heights, Inwood",180561,179941,198192,208414,190020
Manhattan,64,164,Central Park,,,,,
Queens,1,401,"Astoria, Long Island City",185925,185198,188549,211220,191105
Queens,2,402,"Sunnyside, Woodside",95073,88927,94845,109920,113200
Queens,3,403,"Jackson Heights, North Corona",123635,122090,128924,169083,171576
Queens,4,404,"Elmhurst, South Corona",108233,118430,137023,167005,172598
Queens,5,405,"Ridgewood, Glendale, Maspeth",161022,150142,149126,165911,169190
Queens,6,406,"Forest Hills, Rego Park",120429,112245,106996,115967,113257
Queens,7,407,"Flushing, Bay Terrace",207589,204785,220508,242952,247354
Queens,8,408,"Fresh Meadows, Briarwood",142468,125312,132101,146594,151107
Queens,9,409,"Woodhaven, Richmond Hill",110367,109505,112151,141608,143317
Queens,10,410,"Ozone Park, Howard Beach",113857,105651,107768,127274,122396
Queens,11,411,"Bayside, Douglaston, Little Neck",127883,110963,108056,116404,116431
Queens,12,412,"Jamaica, St. Albans, Hollis",206639,189383,201293,223602,225919
Queens,13,413,"Queens Village, Rosedale",184647,173178,177535,196284,188593
Queens,14,414,"The Rockaways, Broad Channel",98228,100592,100596,106686,114978
Queens,80,480,LaGuardia International Airport,,,,,
Queens,81,481,Flushing Meadows Corona Park,,,,,
Queens,82,482,Forest Park,,,,,
Queens,83,483,JFK International Airport,,,,,
Queens,84,484,Jamaica Bay (Queens),,,,,
Staten Island,1,501,"Stapleton, Port Richmond",135875,138489,137806,162609,175756
Staten Island,2,502,"New Springville, South Beach",85985,105128,113944,127071,132003
Staten Island,3,503,"Tottenville, Woodrow, Great Kills",72815,108249,126956,152908,160209
Staten Island,95,595,"Fort Wadsworth, Great Kills Park",,,,,`)
)})
    },
    {
      name: "fdnyLocations",
      inputs: ["d3"],
      value: (function(d3){return(
d3.csvParse(`FacilityName,FacilityAddress,Borough,Postcode,Latitude,Longitude
Engine 4/Ladder 15,42 South Street,Manhattan,10005,40.703466,-74.007538
Engine 10/Ladder 10,124 Liberty Street,Manhattan,10006,40.710072,-74.012523
Engine 6,49 Beekman Street,Manhattan,10038,40.710048,-74.005245
Engine 7/Ladder 1/Battalion 1/Manhattan Borough Command,100-104 Duane Street,Manhattan,10007,40.715463,-74.005938
Ladder 8,14 North Moore Street,Manhattan,10013,40.719759,-74.006678
Engine 9/Ladder 6,75 Canal Street,Manhattan,10002,40.715213,-73.992901
Engine 15/Ladder 18/Battalion 4,25 Pitt Street,Manhattan,10002,40.716395,-73.983478
Engine 28/Ladder 11,222 East 2nd Street,Manhattan,10009,40.721682,-73.982622
Engine 5,340 East 14th Street,Manhattan,10003,40.731752,-73.983536
Engine 55,363 Broome Street,Manhattan,10013,40.720033,-73.995689
Ladder 20/Division 1,253 Lafayette Street,Manhattan,10012,40.723072,-73.996804
Engine 24/Ladder 5/Battalion 2,227-29 6th Avenue,Manhattan,10014,40.727914,-74.003157
Engine 33/Ladder 9,42 Great Jones Street,Manhattan,10012,40.726815,-73.992643
Ladder 3/Battalion 6,108 East 13th Street,Manhattan,10003,40.733329,-73.989421
Squad 18,132 West 10th Street,Manhattan,10014,40.734625,-74.000346
Engine 34/Ladder 21,440 West 38th Street,Manhattan,10018,40.756635,-73.996217
Engine 26,220 West 37th Street,Manhattan,10018,40.753239,-73.990078
Engine 3/Ladder 12/Battalion 7,150 West 19th Street,Manhattan,10011,40.741044,-73.996041
Engine 1/Ladder 24,142-46 West 31st Street,Manhattan,10001,40.74843,-73.990447
Engine 14,14 East 18th Street,Manhattan,10003,40.738143,-73.990964
Engine 16 / Ladder 7 ,234 East 29th Street,Manhattan,10016,40.742209,-73.979535
Engine 21,238 East 40th Street,Manhattan,10016,40.748845,-73.973888
Engine 54/Ladder 4/Battalion 9,782 8th Avenue,Manhattan,10036,40.760792,-73.987182
Engine 23,215 West 58th Street,Manhattan,10019,40.766544,-73.98035
Rescue 1,530 West 43rd Street,Manhattan,10036,40.760892,-73.996405
Engine 40/Ladder 35,131 Amsterdam Avenue  ,Manhattan,10023,40.774505,-73.984619
Ladder 25/District Office 4/Division 3,205-207 West 77th Street,Manhattan,10024,40.781992,-73.979627
Engine 74,120 West 83rd Street ,Manhattan,10024,40.784881,-73.974434
Engine 65,33 West 43rd Street,Manhattan,10036,40.754676,-73.98161
Engine 8 / Ladder 2 / Battalion 8,167 East 51st Street,Manhattan,10022,40.756812,-73.971142
Engine 39/Ladder 16,157-59 East 67th Street,Manhattan,10065,40.76696,-73.963856
Engine 44,221 East 75th Street,Manhattan,10021,40.771427,-73.958521
Engine 22/Ladder 13/Battalion 10,159 East 85th Street,Manhattan,10028,40.778584,-73.955516
Engine 58/Ladder 26,1367 5th Avenue,Manhattan,10029,40.798873,-73.947759
Engine 53/Ladder 43,1836-46 3rd  Avenue,Manhattan,10029,40.788714,-73.946774
Engine 91,242 East 111th Street,Manhattan,10029,40.794327,-73.941345
Engine 35/Ladder 14,2282 3rd Avenue,Manhattan,10035,40.803129,-73.936244
Engine 76/Ladder 22/Battalion 11,145-51 West 100th Street,Manhattan,10025,40.795924,-73.966726
Engine 47,502 West 113th Street,Manhattan,10025,40.805068,-73.962929
Engine 59/Ladder 30,111 West 133rd Street,Manhattan,10030,40.813057,-73.942358
Engine 37/Ladder 40,415 West 125th Street,Manhattan,10027,40.81177,-73.954858
Engine 69/Ladder 28/Battalion 16,248 West 143rd Street,Manhattan,10030,40.821105,-73.941849
Engine 80/Ladder 23,503 West 139th Street,Manhattan,10031,40.821586,-73.950689
Engine 84/Ladder 34,513 West 161st Street,Manhattan,10032,40.83564,-73.940856
Engine 67,518 West 170th Street,Manhattan,10032,40.841394,-73.936836
Engine 93/Ladder 45/Battalion 13,515 West 181st Street,Manhattan,10033,40.848398,-73.931516
Engine 95/Ladder 36,29 Vermilyea Avenue,Manhattan,10034,40.864975,-73.925403
Marine 1,Little West 12th Street/Hudson River,Manhattan,10014,40.740686,-74.011807
Engine 60/Ladder 17/Battalion 14,341 East 143rd Street,Bronx,10454,40.813024,-73.922395
Squad 41,330 East 150th Street,Bronx,10451,40.817502,-73.92037
Engine 71/Ladder 55/Division 6,720 Melrose Avenue,Bronx,10455,40.820422,-73.915778
Engine 50/Ladder 19,1155 Washington Avenue,Bronx,10456,40.829652,-73.907831
Engine 92/Ladder 44/Battalion 17,1259 Morris Avenue,Bronx,10456,40.834627,-73.91331
EMS Station 17 ,1080 Ogden Avenue,Bronx,10452,40.835037,-73.928176
Engine 68/Ladder 49,1160 Ogden Avenue ,Bronx,10452,40.836711,-73.927231
EMS Station 26,1264 Boston Road,Bronx,10456,40.830637,-73.900986
Engine 73/Ladder 42/Battalion 26,655 Prospect Avenue,Bronx,10455,40.815233,-73.903418
Engine 94/Ladder 48/Battalion 3,1226 Seneca Avenue,Bronx,10474,40.818659,-73.888853
Engine 42,1781 Monroe Avenue,Bronx,10457,40.846283,-73.906532
Engine 43/Ladder 59,1901 Sedgwick Avenue,Bronx,10453,40.854413,-73.917148
Rescue 3,1655 Washington Avenue,Bronx,10457,40.841012,-73.901458
"Engine 46, Ladder 27",460 Cross Bronx Expressway,Bronx,10457,40.844121,-73.900366
"Bronx Borough Command, District Office 6 & 7 ",451 East 176th Street,Bronx,10457,40.84622,-73.899437
Engine 82/Ladder 31,1213 Intervale Avenue,Bronx,10459,40.828518,-73.894951
Engine 48/Ladder 56/Division 7,2417 Webster Avenue,Bronx,10458,40.8594,-73.893546
Engine 88/Ladder 38,2225 Belmont Avenue,Bronx,10457,40.851495,-73.88775
Engine 45/Ladder 58/Battalion 18,925 East Tremont Avenue,Bronx,10460,40.84172,-73.883628
Engine 75/Ladder 33/Battalion 19,2175 Walton Avenue,Bronx,10453,40.856116,-73.904179
Engine 81/Ladder 46,3025 Bailey Avenue,Bronx,10463,40.876728,-73.903539
Engine 79/Ladder 37/Battalion 27,2928 Briggs Avenue,Bronx,10458,40.870433,-73.886796
  Engine 96/Ladder 54,1689 Story Avenue,Bronx,10473,40.822794,-73.869368
Engine 64/Ladder 47/District Office 7,1214 Castle Hill Avenue,Bronx,10462,40.832288,-73.851115
Engine 90/Ladder 41,1843 White Plains Road,Bronx,10462,40.846244,-73.866503
Squad 61/Battalion 20,1518 Williamsbridge Road,Bronx,10461,40.844894,-73.846663
Engine 97,1454 Astor Avenue,Bronx,10469,40.859597,-73.844218
Engine 62/Ladder 32,3431 White Plains Road,Bronx,10467,40.876176,-73.867003
Engine 38/Ladder 51,3446 Eastchester Road,Bronx,10469,40.877627,-73.846678
Engine 63/Ladder 39/Battalion 15,755 East 233rd Street,Bronx,10466,40.892803,-73.855483
Engine 66/Ladder 61,21 Asch Loop West,Bronx,10475,40.870016,-73.830873
Engine 89/Ladder 50,2924 Bruckner Boulevard,Bronx,10465,40.83332,-73.827418
Engine 72,3929 East Tremont Avenue,Bronx,10465,40.821377,-73.818597
Engine 70/Ladder 53,169 Schofield Street,Bronx,10464,40.845338,-73.784737
Engine 207/Ladder 110/Battalion 31/Division 11/Brooklyn Borough Command,172 Tillary Street,Brooklyn,11201,40.695983,-73.983159
Engine 226,409 State Street,Brooklyn,11217,40.686982,-73.982876
Engine 205/Ladder 118,74 Middagh Street,Brooklyn,11201,40.700172,-73.992239
Engine 224,274 Hicks Street,Brooklyn,11201,40.692948,-73.996971
Engine 279/Ladder 131,252 Lorraine Street,Brooklyn,11231,40.672335,-73.999611
Engine 202/Ladder 101/Battalion 32,31 Richards Street,Brooklyn,11231,40.680489,-74.006522
Engine 228,436 39th Street,Brooklyn,11232,40.652045,-74.005218
Engine 201/Ladder 114/Battalion 40,5113-5117 4th Avenue,Brooklyn,11220,40.645773,-74.01329
Squad 1,788 Union Street,Brooklyn,11215,40.674858,-73.976491
Engine 239,395 4th Avenue,Brooklyn,11215,40.671829,-73.987476
Engine 220/Ladder 122,530-532 11th Street,Brooklyn,11215,40.665115,-73.981408
Ladder 105,494 Dean Street,Brooklyn,11217,40.681357,-73.973561
Engine 280/Ladder 132,489-91 Saint Johns Place,Brooklyn,11238,40.673415,-73.961648
Rescue 2,1472 Bergen Street,Brooklyn,11213,40.675264,-73.934917
Engine 234/Ladder 123/Battalion 38,1352 Saint Johns Place,Brooklyn,11213,40.670571,-73.933474
Engine 227,423-25 Ralph Avenue,Brooklyn,11233,40.674798,-73.922015
Engine 233/Ladder 176,25 Rockaway Avenue,Brooklyn,11233,40.682616,-73.911687
Engine 217,940 Dekalb Avenue,Brooklyn,11221,40.692896,-73.938066
Engine 222/Battalion 37,32 Ralph Avenue,Brooklyn,11221,40.689385,-73.924006
Engine 214/Ladder 111,495 Hancock Street,Brooklyn,11233,40.684161,-73.935957
Engine 230,701 Park Avenue,Brooklyn,11206,40.697792,-73.947874
Engine 235/Battalion 57,206 Monroe Street,Brooklyn,11216,40.685357,-73.951464
Ladder 102,850-56 Bedford Avenue,Brooklyn,11205,40.695635,-73.956361
Marine 6,Building 292 Brooklyn Navy Yard,Brooklyn,11205,40.702562,-73.972211
Engine 210,160 Carlton Avenue,Brooklyn,11205,40.692758,-73.972774
Engine 211/Ladder 119,26 Hooper Street,Brooklyn,11249,40.701506,-73.962398
Engine 221/Ladder 104,161 South 2nd Street,Brooklyn,11211,40.712978,-73.961259
Engine 216/Ladder 108/Battalion 35,187 Union Avenue,Brooklyn,11211,40.706024,-73.950317
Engine 238/Ladder 106,205 Greenpoint Avenue,Brooklyn,11222,40.730511,-73.951056
Engine 229/Ladder 146,75-77 Richardson Street,Brooklyn,11211,40.718405,-73.949027
Engine 206,1201 Grand Street,Brooklyn,11211,40.715147,-73.927956
Engine 237,43 Morgan Avenue,Brooklyn,11237,40.705334,-73.93162
Engine 218,650 Hart Street,Brooklyn,11221,40.698379,-73.926877
Engine 271/Ladder 124/Battalion 28,392 Himrod Street,Brooklyn,11237,40.703721,-73.916253
Engine 277/Ladder 112,582 Knickerbocker Avenue,Brooklyn,11221,40.696564,-73.914423
Squad 252,617 Central Avenue,Brooklyn,11207,40.688473,-73.908246
Engine 231/Ladder 120/Battalion 44,107 Watkins Street,Brooklyn,11212,40.670374,-73.908033
Engine 283/Division 15,885 Howard Avenue,Brooklyn,11212,40.660877,-73.918214
Engine 332/Ladder 175,165 Bradford Street,Brooklyn,11207,40.675359,-73.892863
Engine 290/Ladder 103,480 Sheffield Avenue,Brooklyn,11207,40.665206,-73.895179
Engine 236,998 Liberty Avenue,Brooklyn,11208,40.677864,-73.872853
Engine 225/Ladder 107/Battalion 39,799 Lincoln Avenue,Brooklyn,11208,40.669602,-73.865685
Engine 310/Ladder 174/Battalion 58,5105 Snyder Avenue,Brooklyn,11203,40.65019,-73.929035
Engine 249/Ladder 113,491 Rogers Avenue,Brooklyn,11225,40.660226,-73.953483
Engine 248,2900 Snyder Avenue,Brooklyn,11226,40.648867,-73.950471
Engine 281/Ladder 147,1210 Cortelyou Road,Brooklyn,11218,40.64012,-73.966847
Engine 255/Ladder 157,1367 Rogers Avenue,Brooklyn,11210,40.636755,-73.950974
Engine 240/Battalion 48,1307 Prospect Avenue,Brooklyn,11218,40.651165,-73.975736
Engine 282/Ladder 148,4210-12 12th Avenue,Brooklyn,11219,40.640157,-73.990379
Engine 247,1336 60th Street,Brooklyn,11219,40.62835,-73.997741
Engine 241/Ladder 109,6630 3rd Avenue,Brooklyn,11220,40.638064,-74.024825
Engine 242,9219 5th Avenue,Brooklyn,11209,40.617597,-74.029547
Engine 284/Ladder 149,1157 79th Street,Brooklyn,11228,40.619961,-74.012986
Engine 243/Ladder 168/Battalion 42,8653 18th Avenue,Brooklyn,11214,40.606301,-74.003637
Engine 250,126 Foster Avenue,Brooklyn,11230,40.627771,-73.976148
Engine 330/Ladder 172 ,2312 65th Street,Brooklyn,11204,40.612343,-73.978973
Engine 276/Ladder 156/Battalion 33,1635 East 14th Street,Brooklyn,11229,40.609428,-73.959346
Engine 253,2429 86th Street,Brooklyn,11214,40.598744,-73.988542
Engine 318/Ladder 166,2510-14 Neptune Avenue,Brooklyn,11224,40.578073,-73.992901
Engine 254/Ladder 153,901 Avenue U,Brooklyn,11223,40.59823,-73.961967
Engine 245/Ladder 161/Battalion 43,2929 West 8th Street,Brooklyn,11224,40.576795,-73.976468
Engine 257/Ladder 170,1361 Rockaway Parkway,Brooklyn,11236,40.646469,-73.903789
Engine 323,6405 Avenue N,Brooklyn,11234,40.619881,-73.915718
Engine 309/Ladder 159,1851 East 48th Street,Brooklyn,11234,40.615732,-73.928488
Engine 246/Ladder 169,2732 East 11th Street,Brooklyn,11235,40.584374,-73.959127
Engine 321,2165 Gerritsen Avenue,Brooklyn,11229,40.602306,-73.935658
Engine 258/Ladder 115,10-40 47th Avenue,Queens,11101,40.745286,-73.95215
Engine 325/Ladder 163,41-24 51st Street,Queens,11377,40.745335,-73.913527
Engine 259/Ladder 128/Battalion 45,33-51 Greenpoint Avenue,Queens,11101,40.735961,-73.933706
Engine 260,11-15 37th Avenue,Queens,11101,40.759696,-73.940603
Engine 261/Ladder 116,3720-22 29th Street,Queens,11101,40.755377,-73.933218
Engine 262,30-89 21st Street,Queens,11102,40.767664,-73.929574
Engine 263/Ladder 117/Battalion 49,42-06 Astoria Boulevard,Queens,11103,40.768508,-73.908822
Engine 312,22-63 35th Street,Queens,11105,40.773796,-73.910194
Engine 307/Ladder 154,81-17 Northern Boulevard,Queens,11372,40.755789,-73.885593
Engine 289/Ladder 138,97-28 43rd Avenue,Queens,11368,40.746168,-73.866158
Engine 316,27-12 Kearney Street,Queens,11369,40.762621,-73.869024
Engine 324/Division 14,108-01 Horace Harding Blvd.,Queens,11368,40.737732,-73.851904
Eng 292/Rescue 4,64-18 Queens Boulevard,Queens,11377,40.741049,-73.900971
Squad 288/Hazmat 1,56-29 68th Street,Queens,11378,40.72625,-73.896512
Engine 287/Ladder 136/Battalion 46,86-53 Grand Avenue,Queens,11373,40.736156,-73.87905
Engine 291/Ladder 140,56-07 Metropolitan Avenue,Queens,11385,40.71295,-73.906791
Engine 305/Ladder 151,111-02 Queens Boulevard,Queens,11375,40.718522,-73.837437
Engine 286/Ladder 135,66-44 Myrtle Avenue,Queens,11385,40.701448,-73.88674
Engine 319,78-11 67th Road,Queens,11379,40.712445,-73.875009
Engine 297/Ladder 130,119-11 14th Road,Queens,11356,40.784806,-73.848387
Engine 295/Ladder 144,12-49 149th Street,Queens,11357,40.789118,-73.81633
Engine 273/Ladder 129,40-18 Union Street,Queens,11354,40.760003,-73.826312
Engine 274/Battalion 52,41-20 Murray Street,Queens,11355,40.762562,-73.812512
Engine 320/Ladder 167,36-18 Francis Lewis Boulevard,Queens,11358,40.763428,-73.786616
Engine 306/Battalion 53,40-18 214th Place,Queens,11361,40.764348,-73.769596
Engine 315/Ladder 125,159-06 Union Turnpike,Queens,11366,40.720329,-73.807761
Engine 299/Ladder 152,61-20 Utopia Parkway,Queens,11365,40.738613,-73.792967
Engine 326/Ladder 160,64-04 Springfield Boulevard,Queens,11364,40.747071,-73.755681
Engine 313/Ladder 164,44-01 244th Street,Queens,11363,40.766659,-73.742451
Engine 251,254-20 Union Turnpike,Queens,11004,40.744582,-73.716559
Engine 293,89-40 87th Street,Queens,11421,40.689493,-73.856104
Engine 285/Ladder 142,103-17 98th Street,Queens,11417,40.682684,-73.842194
Ladder 143,101-02 Jamaica Avenue,Queens,11418,40.695038,-73.846268
Squad 270/Division 13,91-45 121st Street,Queens,11418,40.695411,-73.82626
Engine 308/Battalion 51,107-12 Lefferts Boulevard,Queens,11419,40.684043,-73.823106
Engine 298/Ladder 127/Battalion 50,153-11 Hillside Avenue,Queens,11432,40.70731,-73.804242
Engine 303/Ladder 126,104-12 Princeton Street,Queens,11435,40.693876,-73.806943
Engine 275,111-36 Merrick Boulevard,Queens,11433,40.694052,-73.781115
Engine 301/Ladder 150,91-04 197th Street,Queens,11423,40.714494,-73.762763
Engine 304/Ladder 162,218-44 97th Avenue,Queens,11429,40.71706,-73.735871
Engine 302/Ladder 155,143-15 Rockaway Boulevard,Queens,11436,40.673836,-73.795461
Engine 317/Ladder 165/Battalion 54,117-11 196th Street,Queens,11412,40.69301,-73.755814
Engine 311/Ladder 158,145-50 Springfield Boulevard,Queens,11413,40.663404,-73.759473
Engine 314,142-04 Brookville Boulevard,Queens,11422,40.663992,-73.740515
Engine 331/Ladder 173,158-57 Cross Bay Boulevard,Queens,11414,40.65993,-73.840045
Engine 264/Engine 328/Ladder 134,16-15 Central Avenue,Queens,11691,40.604897,-73.752226
Engine 265/Ladder 121/Battalion 47 EMS Station 47,48-06 Rockaway Beach Boulevard,Queens,11691,40.593377,-73.778978
Engine 266/Battalion 47,92-20 Rockaway Beach Boulevard,Queens,11693,40.58633,-73.815775
Engine 268/Ladder 137,257 Beach 116th Street,Queens,11694,40.580627,-73.837683
Engine 329,402 Beach 169th Street,Queens,11695,40.566034,-73.881874
Marine 9,Saint George Ferry Terminal,Staten Island,10301,40.644112,-74.072559
Engine 155/Ladder 78,14 Brighton Avenue,Staten Island,10301,40.637734,-74.087746
Ladder 79/Battalion 22,1189 Castleton Avenue,Staten Island,10310,40.63415,-74.122199
Engine 156,412 Broadway,Staten Island,10310,40.631093,-74.116574
Engine 163/Ladder 83,875 Jewett Avenue,Staten Island,10314,40.615251,-74.130971
Engine 153/Ladder 77,74 Broad Street,Staten Island,10304,40.625167,-74.077772
Engine 165/Ladder 85,3067 Richmond Road,Staten Island,10306,40.575827,-74.123727
Engine 157/Ladder 80,1573 Castleton Avenue,Staten Island,10302,40.636052,-74.135343
Engine 158,65 Harbor Road,Staten Island,10303,40.635547,-74.160224
Engine 166/Ladder 86,1400 Richmond Avenue,Staten Island,10314,40.614265,-74.157735
Engine 154/District Office 8/ Staten Island Borough Command,3730 Victory Boulevard,Staten Island,10314,40.598213,-74.180462
Engine 152/Battalion 21,256 Hylan Boulevard,Staten Island,10305,40.611873,-74.070467
Engine 161/Ladder 81,278 Mc Clean Avenue,Staten Island,10305,40.596826,-74.070138
Engine 160/Rescue 5/Division 8,1850 Clove Road,Staten Island,10304,40.607485,-74.089111
Engine 159,1592 Richmond Road,Staten Island,10304,40.590935,-74.100895
Engine 162/Ladder 82/Battalion 23,256 Nelson Avenue,Staten Island,10308,40.543205,-74.147097
Engine 167/Ladder 87,345 Annadale Road,Staten Island,10312,40.554174,-74.175809
Engine 164/Ladder 84,1560 Drumgoole Road West,Staten Island,10312,40.535332,-74.195611
Engine 168/EMS Station 23,1100 Rossville Avenue,Staten Island,10309,40.553977,-74.212812
Engine 151/Ladder 76,7219 Amboy Road,Staten Island,10307,40.512518,-74.238822`)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`This cell adds LatLng point objects from the individual Lat and Lng fields`
)})
    },
    {
      inputs: ["fdnyLocations","L"],
      value: (function(fdnyLocations,L){return(
// Make a LatLng Object for each entry's Lat and Lng strings
fdnyLocations.forEach(function(d) {
  d.LatLng = new L.LatLng(d.Latitude, d.Longitude)})
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`## Axes and scaling functions`
)})
    },
    {
      name: "linea",
      inputs: ["d3","x2","y3"],
      value: (function(d3,x2,y3){return(
d3.line()
    .x(d => x2(+d.timebin))
    .y(d => y3(+d.cdf))
)})
    },
    {
      name: "lineaDate",
      inputs: ["d3","dateScale","medianScale"],
      value: (function(d3,dateScale,medianScale){return(
d3.line()
    .x(d => dateScale(new Date(d.month)))
    .y(d => medianScale(+d.median))
)})
    },
    {
      name: "colorSchemes",
      inputs: ["d3"],
      value: (function(d3){return(
new Object({EMS: d3.schemeBlues[6], FDNY: d3.schemeReds[5]})
)})
    },
    {
      name: "domains",
      value: (function(){return(
new Object({EMS: [250,550], FDNY: [150,400]})
)})
    },
    {
      name: "color",
      inputs: ["d3","domains","agency","colorSchemes"],
      value: (function(d3,domains,agency,colorSchemes){return(
d3.scaleQuantize()
  .domain(domains[agency])
  .range(colorSchemes[agency])
)})
    },
    {
      name: "x2",
      inputs: ["d3","binsize","numbins","margin","width"],
      value: (function(d3,binsize,numbins,margin,width){return(
d3.scaleLinear()
    .domain([0, binsize*numbins]) // d3.max(testd.map(x=>+x.timebin+30))]) 
    .range([margin.left, width - margin.right])
)})
    },
    {
      name: "dateScale",
      inputs: ["d3","margin","width"],
      value: (function(d3,margin,width){return(
d3.scaleTime()
    .domain([new Date(2013, 0, 1, 0), new Date(2017, 11, 31, 12)])
    .range([margin.left, width - margin.right])
)})
    },
    {
      name: "dateAxis",
      inputs: ["height","margin","d3","dateScale","width","dataSets"],
      value: (function(height,margin,d3,dateScale,width,dataSets){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(dateScale).ticks(d3.timeYear).tickSizeOuter(0))
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(dataSets.timebin))
)})
    },
    {
      name: "medianScale",
      inputs: ["d3","height","margin"],
      value: (function(d3,height,margin){return(
d3.scaleLinear()
    .domain([150, 600]).nice()
    .range([height - margin.bottom, margin.top])
)})
    },
    {
      name: "medianAxis",
      inputs: ["margin","d3","medianScale","dataSets"],
      value: (function(margin,d3,medianScale,dataSets){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(medianScale))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
)})
    },
    {
      name: "y2",
      inputs: ["d3","filterData","height","margin"],
      value: (function(d3,filterData,height,margin){return(
d3.scaleLinear()
    .domain([0, d3.max(filterData, d => +d.count)]).nice()
    .range([height - margin.bottom, margin.top])
)})
    },
    {
      name: "y3",
      inputs: ["d3","height","margin"],
      value: (function(d3,height,margin){return(
d3.scaleLinear()
    .domain([0, 1]).nice()
    .range([height - margin.bottom, margin.top])
)})
    },
    {
      name: "legendX",
      inputs: ["d3","domains","agency"],
      value: (function(d3,domains,agency){return(
d3.scaleLinear()
    .domain(domains[agency])
    .range([0, 260])
)})
    },
    {
      name: "xAxis",
      inputs: ["height","margin","d3","x2","width","dataSets"],
      value: (function(height,margin,d3,x2,width,dataSets){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x2).tickSizeOuter(0))
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(dataSets.timebin))
)})
    },
    {
      name: "yAxis2",
      inputs: ["margin","d3","y2","dataSets"],
      value: (function(margin,d3,y2,dataSets){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y2))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
)})
    },
    {
      name: "yAxis3",
      inputs: ["width","margin","d3","y3","dataSets"],
      value: (function(width,margin,d3,y3,dataSets){return(
g => g
    .attr("transform", `translate(${width-margin.right},0)`)
    .call(d3.axisRight(y3))
    //.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(dataSets.count))
)})
    },
    {
      name: "t",
      inputs: ["d3"],
      value: (function(d3){return(
() => d3.transition()
                            .duration(250)
                            .ease(d3.easeLinear)
)})
    },
    {
      name: "reColor",
      inputs: ["color","agency","fireCat"],
      value: (function(color,agency,fireCat){return(
d  =>  d.style('stroke', "#bbb")
                            .style('stroke-width', "1px")
                            .style("fill", function(d) { 
                              try {
                                return color(d.properties.median[agency][fireCat][0].median); }
                              catch(e) {
                                return color(0)}
                            })
)})
    },
    {
      name: "selectColor",
      value: (function(){return(
d  =>  d.style('stroke', "#ff0")
                            .style('stroke-width', "3px")
                            .style("fill", "#fcf")
)})
    },
    {
      name: "boxColor",
      value: (function(){return(
d  =>  d.style('stroke', "blue")
                            .style('stroke-width', "1px")
                            .style("fill", "#ddd")
)})
    },
    {
      inputs: ["d3"],
      value: (function(d3){return(
  d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  }
)})
    },
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
require("https://d3js.org/d3.v5.js")
)})
    },
    {
      name: "soda",
      inputs: ["require"],
      value: (function(require){return(
require('https://bundle.run/soda-js@0.2.3')
)})
    },
    {

    },
    {
      name: "consumer",
      inputs: ["soda"],
      value: (function(soda){return(
new soda.Consumer('data.cityofnewyork.us')
)})
    },
    {
      name: "L",
      inputs: ["require"],
      value: (function(require){return(
require('leaflet@1.2.0')
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
    {
      inputs: ["md"],
      value: (function(md){return(
md`## Ground truth check to validate the quantileFromHistogram estimate`
)})
    },
    {
      name: "numRecs",
      inputs: ["numRecords"],
      value: (function(numRecords){return(
+ Math.floor(numRecords.reduce((sum, d) => sum += +d.count, 0)/2)
)})
    },
    {
      name: "median",
      value: (function(){return(
null
)})
    },
    {
      name: "theMap",
      value: (function(){return(
null
)})
    }
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
require("d3-format")
)})
    }
  ]
};

const notebook = {
  id: "46e43adf74f9a8a9@5811",
  modules: [m0,m1]
};

export default notebook;
