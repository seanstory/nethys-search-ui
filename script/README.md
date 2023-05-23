# Scripts

Until I automate this stuff, this is where I'm putting notes on the manual bits that need to be done to create the experience.

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
