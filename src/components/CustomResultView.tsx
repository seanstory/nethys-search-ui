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

export const CustomResultView = ({
                              result,
                              onClickLink
                          }: {
    result: SearchResult;
    onClickLink: () => void;
}) => {
    const numActions: string | undefined = result.num_actions?.raw;
    const hasRequirements: boolean = result.requirements_flag?.raw === "yes";

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