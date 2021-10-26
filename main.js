const start = async () => {
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        files: ['dep/gsap.min.js']
    });
    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        function: seekHighlight,
    });
}

start();

/*
 *
 *  ✔ Implement popup trigger when highlighing text
 *  ✔ Debounce selection of text, to eliminate multiple wasteful API calls when highlighting
 *  ✔ Establish system for closing popup when clicking outside popup
 *  ✔ Establish system for closing popup when clicking outside popup
 *  
 *
 *
 *
 *
 *
 *
 *
 *
 */

function seekHighlight() {
    let string;

    const getSelectedText = (e) => {
        console.log({
            string
        });
        if (string.length > 1) {
            const popUp = document.createElement("div");
            popUp.className = "popUpContainer";
            popUp.tabIndex = 0;

            const popUpDim = {
                width: 500,
                height: 200,
            }

            const closePopUpEvent = (event) => {
                const xIn = {
                    x1: e.pageX,
                    x2: e.pageX + popUpDim.width,
                }
                const yIn = {
                    y1: e.pageY,
                    y2: e.pageY + popUpDim.height,
                }

                console.log({
                    xIn,
                    yIn
                });
                if (!((event.pageX >= xIn.x1 && event.pageX <= xIn.x2) && (event.pageY >= yIn.y1 && event.pageY <= yIn.y2))) {
                    console.log(event.pageX, event.pageY);

                    gsap.to(popUp, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            console.log("Closing popUp");
                            window.removeEventListener('click', closePopUpEvent);
                            popUp.remove();
                        }
                    });
                }
            }

            window.addEventListener('click', closePopUpEvent);

            Object.assign(
                popUp.style, {
                    position: "absolute",
                    width: `${popUpDim.width}px`,
                    height: `${popUpDim.height}px`,
                    borderRadius: "5px",
                    background: "white",
                    left: `${e.pageX}px`,
                    top: `${e.pageY}px`,
                    zIndex: 1000,
                    opacity: 0,
                    padding: "10px",
                    filter: "drop-shadow(0 4px 10px rgb(0,0,0,.25))",
                    
                }
            )

            gsap.to(popUp, {
                opacity: 1,
                duration: 0.15,
            });

            document.body.appendChild(popUp);
            console.log(e.screenX, e.screenY);

            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${string}`)
                .then(response => response.json())
                .then(data => {
                    const {
                        meanings,
                        origin,
                        phonetics
                    } = data[0];
                    console.log(meanings, origin, phonetics);

                    let fragment = document.createDocumentFragment();

                    let popUpbox = document.createElement('div');
                    let wordAndAudio = document.createElement('div');
                    let audio = document.createElement('div');
                    let audioSvg = document.createElement('object');
                    let wordSpell = document.createElement('p');
                    let wordPhonetic = document.createElement('p');
                    let type = document.createElement('div');
                    let meaning = document.createElement('p');
                    let sentence = document.createElement('li');
                    let similar = document.createElement('p');
                    let synonyms = document.createElement('p');

                    const marginZero = {
                        margin: 0
                    };

                    let styleMap = new Map([
                        [popUpbox.style, {
                            fontFamily: "Maison Neue",
                        }],
                        [wordAndAudio.style, {
                            display: "flex",
                            alignItems: "center",
                        }],
                        [audio.style, {
                            padding: "5px 0 0 0",
                        }],
                        [audioSvg.style, {
                            width: "40px",
                        }],
                        [wordSpell.style, {
                            fontSize: "1.3rem",
                            padding: "0 0 0 16px",
                            margin: 0,
                        }],
                        [wordPhonetic.style, {
                            fontFamily: "monospace",
                            padding: "0 0 0 56px",
                            fontSize: "1rem",
                            margin: 0,
                        }],
                        [type.style, {
                            margin: "10px 0",
                        }],
                        [sentence.style, {
                            margin: "5px 0 10px 0",
                        }],
                        [meaning.style, marginZero],
                        [similar.style, marginZero],
                        [synonyms.style, marginZero],
                    ]);

                    styleMap.forEach((value, key)=>{
                        Object.assign(key, value);
                    });

                    audioSvg.type = "image/svg+xml";
                    audioSvg.data = chrome.runtime.getURL("assets/audio.svg");
                    audioSvg.className = "audio-svg";
                    audioSvg.textContent = "Speaker logo";

                    audio.class = "audio";
                    audio.appendChild(audioSvg);

                    //------------------------------------
                    wordSpell.className = "word-spell";
                    wordSpell.textContent = string;
                    wordAndAudio.className = "word-and-audio";

                    wordAndAudio.appendChild(audio);
                    wordAndAudio.appendChild(wordSpell);
                    //-------------------------------------

                    wordPhonetic.className = "word-phonetic";
                    wordPhonetic.textContent = "/ˈɛpɪɡram/";
                    //-------------------------------------

                    type.className = "type";
                    type.textContent = "noun";
                    //-------------------------------------

                    meaning.className = "meaning";
                    meaning.textContent = "a pithy saying or remark expressing an idea in a clever and amusing way."
                    //-------------------------------------

                    sentence.className = "sentence";
                    sentence.textContent = "\"a Wildean epigram\""
                    //--------------------------------------

                    similar.textContent = "similar";

                    const syns = ["quip", "witticism", "gem", "play on words", "jest", "pun", "sally"]
                    let synString = "";

                    syns.forEach((it, pos) => {
                        if (pos != 6) {
                            synString += `${it}, `;
                        } else {
                            synString += `${it}`;
                        }
                    });

                    synonyms.textContent = synString;
                    //-------------------------------------

                    popUpbox.className = "popup-box";

                    popUpbox.appendChild(wordAndAudio);
                    popUpbox.appendChild(wordPhonetic);
                    popUpbox.appendChild(type);
                    popUpbox.appendChild(meaning);
                    popUpbox.appendChild(sentence);
                    popUpbox.appendChild(similar);
                    popUpbox.appendChild(synonyms);

                    fragment.appendChild(popUpbox);
                    popUp.appendChild(fragment);


                });
        }
        document.removeEventListener('mouseup', getSelectedText);
    }

    document.addEventListener('selectionchange', (e) => {
        string = window.getSelection().toString();
        document.addEventListener('mouseup', getSelectedText);
    });
}