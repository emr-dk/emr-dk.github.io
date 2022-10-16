---
title: "Lav en hurtig blog på Digital Ocean"
date: 2022-10-13T16:09:19+02:00
draft: false
summary: "Sådan kommer du i gang med at lave en personlig side - som den her"
status: "blabla"
---

# Baggrund
Hvis du ikke gider at læse mine overvejelser og anekdoter om processen med at komme i gang så hop ned til det afsnit der kommer nedenfor, der hedder **Vejledning**.

I lang tid har jeg prøvet at få en personlig side ala den her op at køre. Jeg har længe prøvet at komme i gang med en masse forskellige platforme, men var grundlæggende i tvivl om hvordan det tekniske niveau skulle skæres. 
Jeg var ikke synderligt interesseret i at få alt for meget leveret - da hele pointen med min side er at styrke mine kompetencer. Nogen af de forsøg jeg har haft med at komme i gang, har involveret at bygge alt, som i _alt_ op manuelt. Det eneste jeg fik ud af det, var at jeg lærte hvor meget arbejde der går i at bygge en hel applikation alene.
Bare det at opbygge en ordentlig færdighed i HTML og CSS tog lang tid. Ikke at det ikke har været mega givtigt, men det har også vist sig at være _for_ meget. Særligt eftersom jeg ikke regner med nogensinde at blive webudvikler. Så. Udarbejdelsen af en hel blogging platform var taget af tapetet.

En beslutning taget. Så er der da fremdrift. Men hvad skal der så til? Jeg har en stor forkærlighed for Open Source og vil derfor foretrække at gå tilnærmelsesvist den vej. Derudover er jeg ikke nødvendigvis interesseret i at gå den nemmeste vej, og det må gerne lugte lidt af _moderne_ det jeg vælger. Så Drupal, Wordpress og lignende platforme er ude. Min drøm var reelt set at fortsætte ned af Python sporet, men jeg endte med ikke at bryde mig så meget om de platforme jeg fandt der - smagens luner!

Jeg har prøvet at komme i gang med [Ghost](https://ghost.org/), men det var simpelthen for meget. Helt klart en god platform, men den føltes også meget uoverskuelig - og lavet til at man fra dag 1 skulle kunne generere en eller anden form for omsætning. I den proces faldt jeg så lidt tilfældigt over [Hugo](https://gohugo.io), og det er så den jeg er endt med. Hugo er en static site generator. Jeg har tidligere gravet mig ned i Node og JavaScript verdenen, og har særligt kigget på Jekyll. Men det fangede mig aldrig rigtigt. Men nu er den her så.
 
Hvorfor blev det Hugo?

1. Nem at arbejde med
2. Static Page generator


# Vejledning
Min Hugo site er deployed på Digital Ocean. Eneste grund til jeg egentlig bruger denne platform er at jeg i sin tid fik nogle credits - nok for ca. $100. (Du kan også få nogen hvis du vil, bare klik [her](https://m.do.co/c/b5fbaf11d029). Du får $200 og jeg får $25 hver gang du bruger $25).
Derudover synes jeg Digital Ocean er relativt nemt at arbejde med - i hvert fald i forhold til det mareridt Amazon AWS var dengang jeg begyndte at kigge på cloud løsninger. 

Min side er sat sådan op at alt arbejde arbejde jeg laver foregår lokalt på min egen computer. Faktisk bruger jeg Ubuntu gennem WSL2 på en Windows maskine - det fungerer virkelig godt for den her brug i hvert fald. [1;5D[1;5D[1;5D[1;5DC:\Users\barto\Documents\Projekter\website\hugo-dig
Jeg udarbejder rettelser og nye blog posts på min maskine og pusher dem så til Github, hvorfra DigitalOcean så ombygger min Hugo site når jeg pusher til min Git. Det fungerer i det store hele upåklageligt. En fordel ved denne model er at man har et par gratis hosts af statiske websider gennem digital ocean, så man skal ikke engang tænke på noget der.

	git init
 
