importScripts('../lib/d3/d3.v4.min');
onmessage = function (e) {
    var nodes = e.data.nodes;
    var links = e.data.links;

    var simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(links).distance(20).strength(1))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .stop();

    for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
        postMessage({ type: "tick", progress: i / n });
        simulation.tick();
    }

    postMessage({type: "end", nodes: nodes, links: links});
}