import {SearchResult} from "@elastic/search-ui";

const ACTION_COST_ICONS: Record<string, string> = {
    "free-action": "◇",
    "reaction": "↺",
    "one-action": "◆",
    "two-actions": "◆◆",
    "three-actions": "◆◆◆",
};

const ACTION_COST_LABELS: Record<string, string> = {
    "free-action": "Free Action",
    "reaction": "Reaction",
    "one-action": "1 Action",
    "two-actions": "2 Actions",
    "three-actions": "3 Actions",
};

const EQUIPMENT_CATEGORIES = new Set(["Equipment", "Shields"]);

const TRADITION_COLORS: Record<string, string> = {
    "arcane":   "#3a4e8c",
    "divine":   "#8c6b1a",
    "occult":   "#5b3a8e",
    "primal":   "#2e6e3a",
};

export const CustomResultView = ({
                              result,
                              onClickLink
                          }: {
    result: SearchResult;
    onClickLink: () => void;
}) => {
    const numActions: string | undefined = result.num_actions?.raw;
    const hasRequirements: boolean = result.requirements_flag?.raw === "yes";
    const category: string | undefined = result.category?.raw;
    const isEquipment: boolean = typeof category === "string" && EQUIPMENT_CATEGORIES.has(category);
    const isSpell: boolean = category === "Spells";
    const itemLevel: string | undefined = isEquipment ? result.item_level?.raw : undefined;
    const bulk: string | undefined = isEquipment ? result.bulk?.raw : undefined;
    const usage: string | undefined = isEquipment ? result.usage?.raw : undefined;
    const spellLevel: string | undefined = isSpell ? result.spell_level?.raw : undefined;
    const traditions: string[] = isSpell && result.traditions?.raw
        ? (Array.isArray(result.traditions.raw) ? result.traditions.raw : [result.traditions.raw])
        : [];
    const saveThrow: string | undefined = isSpell ? result.save?.raw : undefined;
    const duration: string | undefined = isSpell ? result.duration?.raw : undefined;

    return (
    <li className="sui-result">
        <div className="sui-result__header">
            <h3>
                {/* Maintain onClickLink to correct track click throughs for analytics*/}
                <a onClick={onClickLink} href={result.url?.raw} target='_blank' dangerouslySetInnerHTML={{__html: result.title?.snippet}}/>
            </h3>
            {numActions && (
                <span
                    title={ACTION_COST_LABELS[numActions] ?? numActions}
                    style={{
                        marginLeft: "0.5rem",
                        fontSize: "1rem",
                        color: "#8B0000",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {ACTION_COST_ICONS[numActions] ?? numActions}
                </span>
            )}
            {isSpell && spellLevel && (
                <span
                    title="Spell Level"
                    style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.75rem",
                        background: "#8B0000",
                        color: "#fff",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    Spell {spellLevel}
                </span>
            )}
            {isEquipment && (itemLevel || bulk || usage) && (
                <span style={{ marginLeft: "0.5rem", display: "inline-flex", gap: "0.35rem", flexWrap: "wrap", flexShrink: 0 }}>
                    {itemLevel && (
                        <span
                            title="Item Level"
                            style={{
                                fontSize: "0.75rem",
                                background: "#5b3a8e",
                                color: "#fff",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Lvl {itemLevel}
                        </span>
                    )}
                    {bulk && (
                        <span
                            title="Bulk"
                            style={{
                                fontSize: "0.75rem",
                                background: "#2c5f8a",
                                color: "#fff",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Bulk {bulk}
                        </span>
                    )}
                    {usage && (
                        <span
                            title="Usage"
                            style={{
                                fontSize: "0.75rem",
                                background: "#3a6e4a",
                                color: "#fff",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {usage}
                        </span>
                    )}
                </span>
            )}
            {
                result.thumbnail_url?.raw &&
                <span className="sui-result__image">
                    <a href={result.thumbnail_url?.raw} target='_blank' >
                        <img src={result.thumbnail_url?.raw} alt="" style={{height: "100px"}} />
                    </a>
                </span>
            }
        </div>
        <div className="sui-result__body">
            {/* use 'raw' values of fields to access values without snippets */}

            {/* Use the 'snippet' property of fields with dangerouslySetInnerHtml to render snippets */}
            <ul className="sui-result__details">
                {
                    result.subtitle &&
                    <li>
                        {/*<span className="sui-result__key">keywords</span>*/}
                        <span className="sui-result__value"><b>{result.subtitle?.raw}</b></span>
                    </li>
                }
                <li>
                    <span className="sui-result__key">category</span>
                    <span className="sui-result__value">{result.category?.raw}</span>
                    {hasRequirements && (
                        <span
                            title="Has Requirements"
                            style={{
                                marginLeft: "0.5rem",
                                fontSize: "0.75rem",
                                background: "#6c757d",
                                color: "#fff",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                verticalAlign: "middle",
                            }}
                        >
                            Req
                        </span>
                    )}
                </li>
                {
                    result.sub_category?.raw &&
                    <li>
                        <span className="sui-result__key">sub-category</span>
                        <span className="sui-result__value">{result.sub_category?.raw}</span>
                    </li>
                }
                <li>
                    {/*<span className="sui-result__key">short description</span>*/}
                    <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.meta_description?.raw}}/>
                </li>
                {
                    result.body_content?.snippet &&
                    <li>
                        <span className="sui-result__key">{result.body_content?.snippet.includes("<em>") ? "snippet" : "preview"}</span>
                        <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.body_content?.snippet}}/>
                    </li>
                }
                {isSpell && (traditions.length > 0 || saveThrow || duration) && (
                    <li>
                        <span className="sui-result__key">spell</span>
                        <span className="sui-result__value" style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            {traditions.map((trad: string) => (
                                <span
                                    key={trad}
                                    title={`Tradition: ${trad}`}
                                    style={{
                                        fontSize: "0.75rem",
                                        background: TRADITION_COLORS[trad.toLowerCase()] ?? "#555",
                                        color: "#fff",
                                        padding: "1px 6px",
                                        borderRadius: "3px",
                                        whiteSpace: "nowrap",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {trad}
                                </span>
                            ))}
                            {saveThrow && (
                                <span
                                    title="Saving Throw"
                                    style={{
                                        fontSize: "0.75rem",
                                        background: "#6c4a00",
                                        color: "#fff",
                                        padding: "1px 6px",
                                        borderRadius: "3px",
                                        whiteSpace: "nowrap",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    Save: {saveThrow}
                                </span>
                            )}
                            {duration && (
                                <span
                                    title="Duration"
                                    style={{
                                        fontSize: "0.75rem",
                                        background: "#2c5f8a",
                                        color: "#fff",
                                        padding: "1px 6px",
                                        borderRadius: "3px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {duration}
                                </span>
                            )}
                        </span>
                    </li>
                )}
                {
                    result.traits?.raw && Object.values(result.traits?.raw).length > 0 &&
                    <li>
                        <span className="sui-result__key">traits</span>
                        <span className="sui-result__value">{Object.values(result.traits?.raw).join(", ")}</span>
                    </li>
                }
                {
                    result.meta_keywords &&
                    <li>
                        <span className="sui-result__key">keywords</span>
                        <span className="sui-result__value">{Object.values(result.meta_keywords?.raw).join(", ")}</span>
                    </li>
                }
            </ul>
        </div>
    </li>
    );
};
export {}