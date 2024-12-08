// Endpoint de la API de Google Apps Script
const endpoint = "https://script.google.com/macros/s/AKfycbwPSs6kfxHvLskjIL-Oxnw4wiW8cuGPe-Qgh0lqoJulU4gNvYdohNZRhyLXk-AmyLpj/exec";

// Función para calcular el costo
async function calcularCosto() {
    const destino = document.getElementById("entrega").value;
    const valorCompra = Number(document.getElementById("valorCompra").value);
    const pesoCompra = Number(document.getElementById("pesoCompra").value);

    // Validación de datos
    if (!destino || !valorCompra || !pesoCompra || pesoCompra <= 0 || valorCompra <= 0) {
        document.getElementById("resultado").textContent = "Por favor, ingresa valores válidos.";
        return;
    }

    // Mostrar el efecto de carga
    const loader = document.querySelector(".loader");
    loader.style.display = 'block'; // Mostrar el loader
    document.getElementById("resultado").style.display = 'none'; // Ocultar resultados previos

    try {
        let data;

        // Verificar si hay datos en localStorage
        const cacheData = localStorage.getItem("costoEnvioData");
        const cacheTimestamp = localStorage.getItem("costoEnvioTimestamp");

        // Verificar si los datos son actuales (10 minutos)
        if (cacheData && cacheTimestamp && Date.now() - cacheTimestamp < 600000) {
            data = JSON.parse(cacheData);
            if (!data || !data.fletes || !data.impuestos) {
                throw new Error("Datos en caché no válidos.");
            }
            console.log("Datos cargados desde localStorage.");
        } else {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`Error en la respuesta del servidor: ${response.status}`);
            }
            data = await response.json();
            localStorage.setItem("costoEnvioData", JSON.stringify(data));
            localStorage.setItem("costoEnvioTimestamp", Date.now());
            console.log("Datos cargados desde la API y almacenados en localStorage.");
        }

        // Calcular costo de flete
        const filaFlete = data.fletes.find(row => row.destino === destino);
        const costoFlete = filaFlete ? Number(filaFlete.costo) : 0;

        // Calcular impuestos
        let totalImpuestos = 0;
        let impuestosTabla = '<table><tr><th>Impuesto</th><th>Valor</th></tr>';

        data.impuestos.forEach(impuesto => {
            const impuestoValor = valorCompra * (impuesto.porcentaje / 100);
            totalImpuestos += impuestoValor;
            impuestosTabla += `<tr><td>${impuesto.nombre}</td><td>USD ${impuestoValor.toFixed(2)}</td></tr>`;
        });

        impuestosTabla += '</table>';

        // Calcular costo por peso
        const costoPorPesoPorUnidad = 30; 
        const costoPorPeso = pesoCompra * costoPorPesoPorUnidad; 
        const costoTotal = valorCompra + costoFlete + costoPorPeso + totalImpuestos;

        // Mostrar resultado
        const resultado = `
            <div>
                <h2>Desglose de costos:</h2>
                <p>Costo de Envío: USD ${costoFlete.toFixed(2)}</p>
                <p>Costo por Peso: USD ${costoPorPeso.toFixed(2)}</p>
                <h3>Impuestos:</h3>
                ${impuestosTabla}
                <p><strong>Costo Total: USD ${costoTotal.toFixed(2)}</strong></p>
            </div>`;

        document.getElementById("resultado").innerHTML = resultado;
        document.getElementById("resultado").style.display = 'block'; // Mostrar el resultado
    } catch (error) {
        console.error("Error al calcular el costo:", error);
        document.getElementById("resultado").textContent = error.message || "Hubo un error al calcular el costo. Verifica tu conexión o intenta más tarde.";
    } finally {
        // Ocultar el efecto de carga
        loader.style.display = 'none'; // Ocultar el loader
    }
}

// Función para alternar entre modo oscuro y claro
document.getElementById("toggleMode").addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
    document.querySelector(".calculator-container").classList.toggle("dark-mode");
    document.querySelectorAll(".input-field").forEach(input => input.classList.toggle("dark-mode"));
    document.querySelector(".calculate-btn").classList.toggle("dark-mode");
    if (document.getElementById("resultado")) {
        document.getElementById("resultado").classList.toggle("dark-mode");
    }
    this.textContent = document.body.classList.contains("dark-mode") ? "Modo Claro" : "Modo Oscuro";
});