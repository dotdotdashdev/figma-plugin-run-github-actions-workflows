import { IconCaretDown16, IconCaretRight16, IconCross32, IconPlay32, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { Fragment, h, JSX } from "preact";
import { useCallback, useState } from "preact/hooks";

import { GitHubActionsWorkflow, useSettings } from "../../Settings";
import { NotifyHandler } from "../../types";
import { ButtonIcon } from "./ButtonIcon";
import { ManageWorkflow } from "./ManageWorkflow";
import { Title } from "./Title";

export function GitHubActionsWorkflows(): JSX.Element {
    const [settings, dispatch] = useSettings();
    const [openIndexes, setOpenIndexes] = useState({}) as any;

    const isValidWorkflow = useCallback((workflow: GitHubActionsWorkflow) => {
        // https://docs.github.com/en/rest/reference/actions#get-a-workflow
        return fetch(`https://api.github.com/repos/${workflow.owner}/${workflow.repo}/actions/workflows/${workflow.workflow_id}`, {
            method: "GET",
            headers: {
                Authorization: `token ${workflow.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        }).then(async (response) => {
            const { message: errorMessage, state } = await response.json();

            if (response.status === 200) {
                emit<NotifyHandler>("NOTIFY", `Workflow "${workflow.name}" saved!`);
            } else {
                emit<NotifyHandler>("NOTIFY", `Error when saving workflow with message "${errorMessage}"`, { error: true });
            }

            return state === "active";
        });
    }, []);

    const handleRunWorkflow = useCallback(
        (workflow: GitHubActionsWorkflow) => {
            console.group("Info");
            console.log("workflow", { ...workflow, access_token: "***" });
            console.group("Inputs");
            // console.log('fileKey', settings.fileKey)
            console.log("currentUser", settings.currentUser);
            console.log("branchUrl", settings.branchUrl);
            console.log("title", settings.title);
            console.log("description", settings.description);
            console.log("page", settings.page);
            console.log("selection", settings.selection);
            console.groupEnd();
            console.groupEnd();

            // https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
            fetch(`https://api.github.com/repos/${workflow.owner}/${workflow.repo}/actions/workflows/${workflow.workflow_id}/dispatches`, {
                method: "POST",
                headers: {
                    Authorization: `token ${workflow.access_token}`,
                    Accept: "application/vnd.github.v3+json",
                },
                body: JSON.stringify({
                    ref: workflow.ref,
                    inputs: {
                        // fileKey: settings.fileKey,
                        currentUser: settings.currentUser,
                        branchUrl: settings.branchUrl,
                        title: settings.title,
                        description: settings.description,
                        page: JSON.stringify(settings.page),
                        selection: JSON.stringify(settings.selection),
                    },
                }),
            }).then(async (response) => {
                if (response.status === 204) {
                    emit<NotifyHandler>("NOTIFY", `Workflow "${workflow.name}" triggered!`);
                    const currentdate = new Date();
                    const datetime = currentdate.getMonth() + 1 + "/" + currentdate.getDate() + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes();
                    const archiveWorkflow = {
                        ...workflow,
                        currentUser: settings.currentUser,
                        branchUrl: settings.branchUrl,
                        title: settings.title,
                        description: settings.description,
                        page: settings.page,
                        selection: settings.selection,
                        datetime,
                    };
                    dispatch({ type: "ADD_WORKFLOWS_TRIGGERED", payload: archiveWorkflow });
                    dispatch({ type: "EDIT_BRANCH_URL", branchUrl: "" });
                    dispatch({ type: "EDIT_TITLE", title: "" });
                    dispatch({ type: "EDIT_DESCRIPTION", description: "" });
                    setOpenIndexes({ 0: true });
                } else {
                    const { message } = await response.json();
                    emit<NotifyHandler>("NOTIFY", message, { error: true });
                }
            });
        },
        [settings]
    );

    // const handleAddWorkflow = useCallback(async (workflow: GitHubActionsWorkflow) => {
    //     const isValid = await isValidWorkflow(workflow);

    //     if (isValid) {
    //         dispatch({ type: "ADD_WORKFLOW", payload: workflow });
    //     }

    //     return isValid;
    // }, []);

    const handleEditWorkflow = useCallback(async (index: number, workflow: GitHubActionsWorkflow) => {
        const isValid = await isValidWorkflow(workflow);

        if (isValid) {
            dispatch({ type: "EDIT_WORKFLOW", index, payload: workflow });
        }

        return isValid;
    }, []);

    const handleRemoveWorkflow = useCallback((index: number, workflow: GitHubActionsWorkflow) => {
        if (confirm(`Do you really want to remove "${workflow.name}" workflow?`)) {
            dispatch({ type: "REMOVE_WORKFLOW", index });
            emit<NotifyHandler>("NOTIFY", `Workflow "${workflow.name}" removed!`);
        }
    }, []);

    const uploadFile = useCallback((event: any) => {
        let file = event.target.files;

        if (file) {
            var reader = new FileReader();

            reader.addEventListener("load", async function () {
                const result = JSON.parse(typeof reader.result === "string" ? reader.result : "");
                const isValid = await isValidWorkflow(result);
                if (isValid) {
                    dispatch({ type: "ADD_WORKFLOW", payload: result });
                }
                const input = document.getElementById("workflow-json-upload") as HTMLInputElement;
                if (input) {
                    input.value = "";
                }
            });
            reader.readAsText(file[0]);
        }
    }, []);

    return (
        <Fragment>
            <Title>Workflows</Title>

            {settings?.workflows.map((workflow, index) => (
                <Fragment>
                    <VerticalSpace space="small" />
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Text style={{ flex: "1 1 auto" }}>
                            <a target="_blank" href={`https://github.com/${workflow.owner}/${workflow.repo}/actions/workflows/${workflow.workflow_id}`}>
                                {workflow.name}
                            </a>
                        </Text>
                        <ButtonIcon onClick={() => handleRunWorkflow(workflow)}>
                            <IconPlay32 />
                        </ButtonIcon>
                        <ManageWorkflow workflow={workflow} onSubmit={(workflow) => handleEditWorkflow(index, workflow)} />
                        <ButtonIcon destructive secondary onClick={() => handleRemoveWorkflow(index, workflow)}>
                            <IconCross32 />
                        </ButtonIcon>
                    </div>
                </Fragment>
            ))}

            <VerticalSpace space="large" />
            <VerticalSpace space="large" />
            <Title>Add Workflow</Title>
            <VerticalSpace space="small" />
            <input id="workflow-json-upload" type="file" accept=".json,application/json" onChange={uploadFile}>
                Upload file here
            </input>
            <VerticalSpace space="large" />
            <Title>Workflows Triggered</Title>
            <VerticalSpace space="small" />
            {[...settings?.workflowsTriggered].reverse().map((workflow, index) => {
                const showDetails = openIndexes[String(index)];
                return (
                    <Fragment>
                        <VerticalSpace space="small" />
                        <div
                            style={{ display: "flex", alignContent: "center" }}
                            onClick={() => {
                                const toggle = openIndexes[index] ? !openIndexes[index] : true;
                                const key = String(index);
                                const updatedIndexes = { ...openIndexes, [key]: toggle };
                                setOpenIndexes(updatedIndexes);
                            }}>
                            <Text style={{ fontWeight: 700 }}>{workflow.name}</Text>
                            {showDetails ? <IconCaretDown16 style={{ marginTop: "-3px" }} /> : <IconCaretRight16 style={{ marginTop: "-3px" }} />}
                        </div>
                        {showDetails && (
                            <div style={{ paddingLeft: "10px" }}>
                                <VerticalSpace space="small" />
                                <Text key={`${index}-${workflow.branchUrl}`}>Branch URL: {workflow.branchUrl}</Text>
                                <VerticalSpace space="small" />
                                <Text key={`${index}-${workflow.title}`}>Title: {workflow.title}</Text>
                                <VerticalSpace space="small" />
                                <Text key={`${index}-${workflow.description}`}>Description: {workflow.description}</Text>
                                <VerticalSpace space="small" />
                                <Text key={`${index}-${workflow.datetime}`}>Timestamp: {workflow.datetime}</Text>
                                <VerticalSpace space="small" />
                            </div>
                        )}
                    </Fragment>
                );
            })}
            <VerticalSpace space="large" />
        </Fragment>
    );
}
