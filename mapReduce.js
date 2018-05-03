/*
 * Khyber Sen and Helen Ye
 * SoftDev2 pd7
 * K19 -- Onions, Bell Peppers, and Celery, Oh My!
 * 2018-05-03
 */

equaling = function(obj) {
    return o => obj === o;
};

Array.prototype.including = function(useSet = true) {
    if (useSet) {
        const set = new Set(this);
        return set.has.bind(set);
    } else {
        return this.includes.bind(this);
    }
};

Array.prototype.sum = function() {
    return this.length === 0 ? 0 : this.reduce((a, b) => a + b);
};

Array.prototype.average = function() {
    return this.sum() / this.length;
};

Array.prototype.median = function() {
    const n = this.length;
    return n & 1 ? this[n >> 1] : 0.5 * (this[n >> 1] + this[n >> 1 + 1]);
};

Array.prototype.medianValue = function(valueFunc) {
    const total = this.map(valueFunc).sum();
    let mid = total / 2;
    return this.reduce((a, b) => {
        const value = valueFunc(a);
        if (mid < value) {
            return a;
        } else {
            mid -= value;
            return b;
        }
    });
};

Array.prototype.max = function(valueFunc) {
    let maxI = 0;
    let max = valueFunc(this[maxI]);
    for (let i = maxI + 1; i < this.length; i++) {
        const value = valueFunc(this[i]);
        if (value > max) {
            max = value;
            maxI = i;
        }
    }
    return this[maxI];
};

Array.prototype.toObject = function() {
    return this.reduce((o, [property, value]) => (o[property] = value, o), {});
};

Array.prototype.flattenObjects = function() {
    if (this.length === 0) {
        return {};
    }
    return Object.keys(this[0])
        .map(key => [key, this.map(e => e[key])])
        .toObject();
};

Array.prototype.peek = function(func) {
    this.forEach(func);
    return this;
};

Array.prototype.derivative = function() {
    const n = this.length;
    if (n === 0) {
        return [];
    }
    if (n === 1) {
        return [0.5 * (this[0] + this[1])];
    }
    const derivative = new Array(n - 2);
    for (let i = 0; i < n - 2; i++) {
        derivative[i] = 0.5 * (this[i] + this[i + 2]);
    }
    return derivative;
};

HTMLElement.prototype.append = function(tag) {
    return this.appendChild(document.createElement(tag));
};

const zip = function(...arrays) {
    const length = Math.max(...arrays.map(a => a.length));
    const zipped = new Array(length);
    for (let i = 0; i < length; i++) {
        zipped[i] = arrays.map(a => a[i]);
    }
    return zipped;
};

const Range = Object.freeze({
    
    new(from, to) {
        if (!to) {
            to = from;
            from = 0;
        }
        
        return {
            
            map(func) {
                const a = new Array(to - from);
                for (let i = from; i < to; i++) {
                    a[i - from] = func(i);
                }
                return a;
            },
            
            forEach(func) {
                for (let i = from; i < to; i++) {
                    func(i);
                }
            },
            
            toArray() {
                return this.map(i => i);
            },
            
            toInterval() {
                return [from, to];
            },
            
        };
        
    },
    
    ofDomain(domain) {
        return this.new(Math.min(...domain), Math.max(...domain));
    },
    
});

const corsServerUrl = "https://cors-anywhere.herokuapp.com/";

const corsFetch = async function(input) {
    return await fetch(corsServerUrl + input, {
        headers: {
            Origin: window.location.host,
        },
        cache: "force-cache",
    });
};

const fetchPopulationData = async function(input) {
    const response = await corsFetch(`http://api.population.io/1.0/${input}?format=json`);
    return await response.json();
};

const fetchCountries = async function() {
    return (await fetchPopulationData("countries")).countries;
};

const fetchCountryPopulationInYear = async function(country, year) {
    return await fetchPopulationData(`population/${year}/${country}`);
};

const firstYear = 1950;
const lastYear = 2018;
const yearRange = Range.new(firstYear, lastYear + 1);

const fetchCountryPopulation = function(country) {
    return Promise.all(
        yearRange.map(fetchCountryPopulationInYear.bind(null, country))
    );
};

const processPopulationAges = function(ages) {
    const total = ages.map(e => e.total).sum();
    const male = ages.map(e => e.males).sum();
    const female = total - male;
    const numMinors = ages.filter(e => e.age < 18).map(e => e.total).sum();
    const numElderly = ages.filter(e => e.age >= 100).map(e => e.total).sum();
    return {
        "Population": total,
        "Most Common Age": ages.max(e => e.total).age,
        "Percent Male": 100 * male / total,
        "Percent Female": 100 * female / total,
        "Number of Minors": numMinors,
        "Percent Minors": 100 * numMinors / total,
        "Number of Elderly (>= 100)": numElderly,
        "Percent Elderly (>= 100": 100 * numElderly / total,
        "Median Age": ages.medianValue(e => e.total).age,
        "Average Age": ages.map(e => e.total * e.age).sum() / total,
    };
};

const countriesDiv = d3.select(document.body).append("div");

countriesDiv.append("h1")
    .text("Population Aggregates for Various Countries from 1950 to 2018")
    .styles({
        "text-align": "center",
    });

// TODO add data description

const graphAggregates = function(country, aggregates) {
    const countryDiv = countriesDiv
        .append("div")
        .attrs({
            id: country,
        })
    ;
    countryDiv.append("h3")
        .text(country)
        .styles({
            "text-align": "center",
        })
    ;
    
    const fullSize = {
        width: 500,
        height: 500,
    };
    const margins = {
        top: 20,
        left: 75,
        right: 20,
        bottom: 30,
    };
    const size = {
        width: fullSize.width - margins.left - margins.right,
        height: fullSize.height - margins.top - margins.bottom,
    };
    const scales = {
        x: d3.scaleLinear().rangeRound([0, size.width]),
        y: d3.scaleLinear().rangeRound([size.height, 0]),
    };
    scales.x.domain([firstYear, lastYear]);
    Object.entries(aggregates)
        .map(([field, values]) => {
            const svg = countryDiv.append("svg")
                .attrs(fullSize)
            ;
            const g = svg.append("g")
                .attrs({transform: `translate(${margins.left},${margins.top})`})
            ;
            
            const x = scales.x;
            const y = scales.y.copy().domain(d3.extent(values));
            const line = d3.line()
                .x((d, i) => x(firstYear + i))
                .y(y)
            ;
            
            const axisLabelStyle = {
                "font-size": "16px",
            };
            
            // x axis
            g.append("g")
                .attrs({
                    transform: `translate(${0}, ${size.height})`,
                })
                .call(d3.axisBottom(x))
                .append("text")
                .text("Year")
                .attrs({
                    // transform: `translate(${0}, ${size.height})`,
                    fill: "#000", // TODO
                    x: size.width - 6,
                    y: -6,
                    dx: 0.71 + "em",
                    "text-anchor": "end",
                })
                .styles(axisLabelStyle)
            ;
            
            // y axis
            g.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .text(field)
                .attrs({
                    transform: "rotate(-90)",
                    fill: "#000", // TODO
                    y: 6,
                    dy: 0.71 + "em",
                    "text-anchor": "end",
                })
                .styles(axisLabelStyle)
            ;
            
            // line
            g.append("path")
                .datum(values)
                .attrs({
                    fill: "none",
                    stroke: "steelblue", // TODO
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round",
                    "stroke-width": 1.5, // TODO
                    d: line,
                })
            ;
        });
};

(async () => {
    countriesDiv.i = 0;
    const countryLinksDiv = countriesDiv.append("div");
    setTimeout(() => {
        for (const link of countryLinksDiv.node().children) {
            if (!document.getElementById(link.country)) {
                link.remove();
            }
        }
    }, 1000 * 10);
    (await fetchCountries())
    // .filter(equaling("United States"))
        .filter([
            "United States",
            "Angola",
            "India",
            "China",
            "World",
            "Singapore",
            "Japan",
            "Greece",
            "Brazil",
            // "Nigeria",
            "Iraq",
            "EUROPE",
            "United Kingdom",
            "Qatar",
            "Maldives",
            "Russian Federation",
            "Fiji",
        ].including())
        .map(country => {
            const link = countryLinksDiv.append("div");
            link.node().country = country;
            link.append("a")
                .attrs({
                    href: `#${country}`,
                })
                .text(country)
            ;
            link.append("br");
            return [country, link];
        })
        .forEach(async ([country, link]) => {
            const populations = await fetchCountryPopulation(country);
            try {
                const aggregates = populations.map(processPopulationAges).flattenObjects();
                if (countriesDiv.i++ !== 0) {
                    ["br", "hr", "br"].forEach(countriesDiv.append.bind(countriesDiv));
                }
                graphAggregates(country, aggregates);
            } catch (e) {
                console.error(e);
                country.link.remove();
            }
        });
})();
