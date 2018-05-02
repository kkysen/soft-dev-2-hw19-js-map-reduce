(function() {
    
    const corsServerUrl = "https://cors-anywhere.herokuapp.com/";
    
    const corsFetch = async function(input) {
        return await fetch(corsServerUrl + input, {
            headers: {
                Origin: window.location.host,
            },
            cache: "force-cache",
        });
    };
    
    const fetchCountryData = async function(input) {
        const response = await corsFetch(
            "http://api.worldbank.org/countries" + input + `?per_page=${2 ** (16 - 1) - 1}&format=json`);
        return await response.json();
    };
    
    const fetchCountries = async function() {
        const data = await fetchCountryData("");
        return data[1]
            .filter(country => country.region.id !== "NA") // filter out continents
            .reduce((countries, country) => (countries[country.name] = country, countries), {});
    };
    
    HTMLElement.prototype.append = function(tag) {
        return this.appendChild(document.createElement(tag));
    };
    
    const countriesDiv = document.body.appendChild(document.createElement("div"));
    
    (async function() {
        
        const countries = await fetchCountries();
        
        const fetchCountryPopulation = async function(country) {
            const data = await fetchCountryData(`/${country.iso2Code}/indicators/SP.POP.TOTL`);
            return data[1] && data[1]
                .map(year => ({year: parseInt(year.date), population: year.value}))
                .sort((a, b) => a.year - b.year);
        };
        
        const processPopulation = function(years) {
            // TODO
        };
        
        const displayCountry = function(country) {
            const countryDiv = countriesDiv.append("div");
            
        };
        
        await Promise.all(Object.values(countries)
            .map(async (country) => {
                const population = await fetchCountryPopulation(country);
                if (population) {
                    country.population = population;
                    country.populationAggregates = processPopulation(population);
                }
                displayCountry(country);
                return country;
            })
        );
        
        window.countries = countries;
        console.log(countries);
        
    })();
    
})();