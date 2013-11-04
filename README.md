Magify
================

Magify je alat koji ekstrahira pravu lokaciju greške na temelju dane source-mape uglify-anog javascript koda te linije i stupca u kojemu se greška dogodila u uglify-anom kodu.

Source mapa u ovom slučaju netreba biti deployana uz klijentsku aplikaciju da bi se otkrila greška.

Primjer korištenja
==
neka je dana source mapa app.js.map i neka je dana lokacija greške u minifyanom kodu 2:3047

izvršavanje: node magify.js app.js.map 2:3047

ukoliko je pronađen match producirati će slijedeći output:
lokacija/originalne/fajle.js:linijagreske

ukoliko nije: ništa

