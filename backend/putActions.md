# Device State Machine

Dieses Dokument beschreibt die drei States eines Devices sowie die jeweilige Logik für die State-Transitions.

## States

| Status | State Name      |
|--------|------------------|
| 5      | RUNNING          |
| 13     | SUPERFREEZING    |
| 14     | SUPERCOOLING     |

---

## Transition Rules

### RUNNING (5) → SUPERFREEZING (13)
- GET: Prüfe `processaction`
- If `processaction` contains **4**
  - PUT:
    ```json
    {"processaction": 4}
    ```
  - State change → **13** (SUPERFREEZING)

### SUPERFREEZING (13) → RUNNING (5)
- GET: Prüfe `processaction`
- If `processaction` contains **5**
  - PUT:
    ```json
    {"processaction": 5}
    ```
  - State change → **5** (RUNNING)

### GET actions exampe 

```
{
    "processAction": [
        4,
        6
    ],
    "light": [],
    "ambientLight": [],
    "startTime": [],
    "ventilationStep": [],
    "programId": [],
    "targetTemperature": [
        {
            "zone": 1,
            "min": 1,
            "max": 9
        },
        {
            "zone": 2,
            "min": -26,
            "max": -16
        }
    ],
    "deviceName": true,
    "powerOn": false,
    "powerOff": false,
    "colors": [],
    "modes": [
        1
    ],
    "runOnTime": []
}
```

### PUT actions exmaple - go to superfreezing from running
```
{
    "processAction": 4
}


---

## Mermaid State Machine

```mermaid
stateDiagram-v2
  direction LR

  %% STATES
  [*] --> RUNNING

  RUNNING --> SUPERFREEZING: GET\nprocessaction contains 4\nPUT {"processaction":4}
  SUPERFREEZING --> RUNNING: GET\nprocessaction contains 5\nPUT {"processaction":5}

  %% Additional state (no transition defined yet)
  SUPERCOOLING

  %% Status labels
  note right of RUNNING
    status = 5
  end note

  note right of SUPERFREEZING
    status = 13
  end note

  note right of SUPERCOOLING
    status = 14
  end note

