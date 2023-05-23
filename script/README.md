# Scripts

Until I automate this stuff, this is where I'm putting notes on the manual bits that need to be done to create the experience.

### Testing selectors
In the browser, use:
```javascript
$$("<selector>").map(e=>e.textContent)
```

### Crawler2 Domains
```
          "seed_urls": [
            {
              "created_at": "2023-05-22T22:52:24Z",
              "id": "646bf22835d15d6585706c77",
              "url": "https://2e.aonprd.com/"
            },
            {
              "created_at": "2023-05-22T22:59:44Z",
              "id": "646bf3e035d15d232c706c7a",
              "url": "https://2e.aonprd.com/Actions.aspx"
            },
            {
              "created_at": "2023-05-22T22:59:57Z",
              "id": "646bf3ed35d15df1e9706c7c",
              "url": "https://2e.aonprd.com/Afflictions.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:07Z",
              "id": "646bf3f735d15da1f5706c7e",
              "url": "https://2e.aonprd.com/Ancestries.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:18Z",
              "id": "646bf40235d15d6585706c80",
              "url": "https://2e.aonprd.com/Archetypes.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:28Z",
              "id": "646bf40c35d15d6585706c82",
              "url": "https://2e.aonprd.com/Backgrounds.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:40Z",
              "id": "646bf41835d15d2184706c84",
              "url": "https://2e.aonprd.com/Classes.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:49Z",
              "id": "646bf42135d15df1e9706c86",
              "url": "https://2e.aonprd.com/Conditions.aspx"
            },
            {
              "created_at": "2023-05-22T23:00:59Z",
              "id": "646bf42b35d15d232c706c88",
              "url": "https://2e.aonprd.com/Creatures.aspx"
            },
            {
              "created_at": "2023-05-22T23:01:12Z",
              "id": "646bf43835d15d544c706c8a",
              "url": "https://2e.aonprd.com/Equipment.aspx?All=true"
            },
            {
              "created_at": "2023-05-22T23:01:22Z",
              "id": "646bf44235d15df1e9706c8c",
              "url": "https://2e.aonprd.com/Feats.aspx"
            },
            {
              "created_at": "2023-05-22T23:01:32Z",
              "id": "646bf44c35d15dbfb8706c8e",
              "url": "https://2e.aonprd.com/Hazards.aspx"
            },
            {
              "created_at": "2023-05-22T23:01:42Z",
              "id": "646bf45635d15ddb34706c90",
              "url": "https://2e.aonprd.com/Rules.aspx"
            },
            {
              "created_at": "2023-05-22T23:01:54Z",
              "id": "646bf46235d15df8f9706c92",
              "url": "https://2e.aonprd.com/Skills.aspx"
            },
            {
              "created_at": "2023-05-22T23:02:05Z",
              "id": "646bf46d35d15d1af8706c94",
              "url": "https://2e.aonprd.com/SpellLists.aspx?Tradition=0"
            },
            {
              "created_at": "2023-05-22T23:02:18Z",
              "id": "646bf47a35d15dac5d706c96",
              "url": "https://2e.aonprd.com/Traits.aspx"
            },
            {
              "created_at": "2023-05-22T23:02:29Z",
              "id": "646bf48535d15d1af8706c98",
              "url": "https://2e.aonprd.com/Rules.aspx?ID=1483"
            },
            {
              "created_at": "2023-05-22T23:02:41Z",
              "id": "646bf49135d15ddb34706c9a",
              "url": "https://2e.aonprd.com/Rules.aspx?ID=748"
            },
            {
              "created_at": "2023-05-22T23:02:53Z",
              "id": "646bf49d35d15d0ee1706c9c",
              "url": "https://2e.aonprd.com/Rules.aspx?ID=1587"
            },
            {
              "created_at": "2023-05-22T23:03:07Z",
              "id": "646bf4ab35d15dac5d706c9e",
              "url": "https://2e.aonprd.com/Rules.aspx?ID=686"
            }
          ],
          "deduplication_enabled": true,
          "deduplication_fields": [
            "links",
            "title"
          ]
```

### Crawler2 Configurations (v2)
```
          "crawl_schedule": [
            {
              "unit": "hour",
              "frequency": 24
            }
          ]
```


### Engine settings
- snippet enabled for body_content and title
- relevance slider 4

### Curations

There's a curation for the empty string search. This makes sure the default search page has some good stuff.

##### Query for the IDs of the Classes

Gets the classes and sorts them in alphabetical order (returns title and ID for sanity checking)

```
GET search-nethys/_search
{
  "query":{
    "bool": {
      "must": [
        {
          "match": {
            "meta_keywords": "Class"
          }
        },
        {
          "match": {
            "category": "Classes"
          }
        }
      ]
    }
  },
  "sort": [
    {
      "title.enum": {
        "order": "asc"
      }
    }
  ],
  "_source": ["id", "title"],
  "size": 20
}
```

##### Create the curation

Use the IDs from the above response, like:

```bash
HOST=#host here
API_KEY=#key here
ENGINE_NAME=#engine name here
curl -X POST ${HOST}/api/as/v1/engines/${ENGINE_NAME}/curations \
-H "Authorization: Bearer ${API_KEY}" \
-H 'Content-Type: application/json' \
-d '{
  "queries": [""],
  "promoted": [
"6419ca83b35f0f45336c2e3a",
"6419ca83b35f0febc66c2e46",
"6419ca83b35f0fde906c2e52",
"6419cb00b35f0f9b156d82de",
"6419cb01b35f0f85016d82ff",
"6419cb00b35f0f36a86d82d1",
"6419ca8eb35f0f0ae06c4864",
"6419ca9ab35f0fd5776c654b",
"6419ca9ab35f0fe47d6c6666",
"6419ca89b35f0f7d8e6c3b63",
"6419ca89b35f0f07a96c3b71",
"6419ca8cb35f0f2e0e6c475b",
"6419ca95b35f0f8c8c6c5760",
"6419ca94b35f0f136f6c53c7",
"6419ca98b35f0fb1896c6305",
"6419cb04b35f0f81a46d9161",
"6419cb05b35f0fdd536d9192",
"6419ca8eb35f0f41ab6c487e",
"6419ca95b35f0f5bce6c564d",
"6419ca90b35f0f2fad6c49f7",
"6419ca95b35f0f7d046c5695",
"6419ca95b35f0fbac96c5724"  
  ],
  "hidden": []
}'
```
