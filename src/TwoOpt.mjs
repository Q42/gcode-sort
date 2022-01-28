function two_opt(currentTour, distance){
    const n = currentTour.vertices.length;
    let bestTour = currentTour;
    for(let i=1; i<n-2; i++){
        for(let j=i+1; j<n+1; j++){
            if(j-i == 1) continue;
            const swap = currentTour.vertices.slice(0,i)
                .concat(currentTour.vertices.slice(i,j).reverse(),
                 currentTour.vertices.slice(j,n))
            const newTour = {vertices:swap, cost:distance(swap)};
            if(newTour.cost < bestTour.cost) bestTour = newTour;
        }
    }
    return bestTour;
}

export { two_opt };
