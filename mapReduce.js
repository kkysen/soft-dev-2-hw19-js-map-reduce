HTMLElement.prototype.append = function(tag) {
    return this.appendChild(document.createElement(tag));
};

(() => {
    
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
        const response = await corsFetch(
            "http://api.population.io/1.0/" + input + "?format=json");
        return await response.json();
    };
    
    const fetchCountries = async function() {
        return (await fetchPopulationData("countries")).countries;
    };
    
    const fetchCountryPopulationInYear = async function(country, year) {
        const data = await fetchPopulationData(`population/${year}/${country}`);
    };
    
    const firstYear = 1950;
    const lastYear = 2018;
    
    const fetchCountryPopulation = function(country) {
        return Promise.all(new Array(lastYear - firstYear + 1)
            .fill(0)
            .map((e, i) => i + firstYear)
            .map(fetchCountryPopulationInYear.bind(null, country)));
    };
    
    (async () => {
        (await fetchCountries())
            .forEach(async country => {
                const populations = await fetchCountryPopulation(country);
                const summary = populations.map((population, i) => {
                    const year = firstYear + i;
                });
                
            });
    })();
    
})();