/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { assert } from "chai";
import { mount, shallow, ShallowWrapper } from "enzyme";
import * as React from "react";
import { SinonStub, spy, stub } from "sinon";

import * as Errors from "../../src/common/errors";
import { Alert, Button, Classes, IAlertProps, IButtonProps, Icon, Intent, Keys } from "../../src/index";

describe("<Alert>", () => {
    it("renders its content correctly", () => {
        const noop = () => true;
        const wrapper = shallow(
            <Alert
                className="test-class"
                isOpen={true}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onClose={noop}
            >
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
        );

        assert.lengthOf(wrapper.find(`.${Classes.ALERT}.test-class`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_BODY}`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_CONTENTS}`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_FOOTER}`), 1);
    });

    it("renders the icon correctly", () => {
        const wrapper = shallow(
            <Alert icon="warning-sign" isOpen={true} confirmButtonText="Delete">
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
        );

        assert.lengthOf(wrapper.find(Icon), 1);
    });

    describe("confirm button", () => {
        const onConfirm = spy();
        const onClose = spy();
        let wrapper: ShallowWrapper<IAlertProps, any>;

        beforeEach(() => {
            onConfirm.resetHistory();
            onClose.resetHistory();
            wrapper = shallow(
                <Alert
                    icon="warning-sign"
                    intent={Intent.PRIMARY}
                    isOpen={true}
                    confirmButtonText="Delete"
                    onConfirm={onConfirm}
                    onClose={onClose}
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
        });

        afterEach(() => wrapper.unmount());

        it("text is confirmButtonText", () => {
            assert.equal(wrapper.find(Button).prop("text"), "Delete");
        });

        it("intent inherited from prop", () => {
            assert.equal(wrapper.find(Button).prop("intent"), Intent.PRIMARY);
        });

        it("onConfirm and onClose triggered on click", () => {
            wrapper.find(Button).simulate("click");
            assert.isTrue(onConfirm.calledOnce);
            assert.isTrue(onClose.calledOnce);
            assert.strictEqual(onClose.args[0][0], true);
        });
    });

    describe("cancel button", () => {
        const onCancel = spy();
        const onClose = spy();
        let wrapper: ShallowWrapper<IAlertProps, any>;
        let cancelButton: ShallowWrapper<IButtonProps, any>;

        beforeEach(() => {
            onCancel.resetHistory();
            onClose.resetHistory();
            wrapper = shallow(
                <Alert
                    icon="warning-sign"
                    intent={Intent.PRIMARY}
                    isOpen={true}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    onCancel={onCancel}
                    onClose={onClose}
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
            cancelButton = wrapper.find(Button).last();
        });

        afterEach(() => wrapper.unmount());

        it("text is cancelButtonText", () => {
            assert.equal(cancelButton.prop("text"), "Cancel");
        });

        it("intent is undefined", () => {
            assert.isUndefined(cancelButton.prop("intent"));
        });

        it("onCancel and onClose triggered on click", () => {
            cancelButton.simulate("click");
            assert.isTrue(onCancel.calledOnce);
            assert.isTrue(onClose.calledOnce);
            assert.strictEqual(onClose.args[0][0], false);
        });

        it("canEscapeKeyCancel enables escape key", () => {
            const alert = mount<IAlertProps>(
                <Alert isOpen={true} cancelButtonText="Cancel" confirmButtonText="Delete" onCancel={onCancel}>
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
            const overlay = alert.find(".pt-overlay").hostNodes();

            overlay.simulate("keydown", { which: Keys.ESCAPE });
            assert.isTrue(onCancel.notCalled);

            alert.setProps({ canEscapeKeyCancel: true });
            overlay.simulate("keydown", { which: Keys.ESCAPE });
            assert.isTrue(onCancel.calledOnce);

            alert.unmount();
        });

        it("canOutsideClickCancel enables outside click", () => {
            const alert = mount<IAlertProps>(
                <Alert isOpen={true} cancelButtonText="Cancel" confirmButtonText="Delete" onCancel={onCancel}>
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
            const backdrop = alert.find(".pt-overlay-backdrop").hostNodes();

            backdrop.simulate("mousedown");
            assert.isTrue(onCancel.notCalled);

            alert.setProps({ canOutsideClickCancel: true });
            backdrop.simulate("mousedown");
            assert.isTrue(onCancel.calledOnce);

            alert.unmount();
        });
    });

    describe("warnings", () => {
        let warnSpy: SinonStub;
        before(() => (warnSpy = stub(console, "warn")));
        afterEach(() => warnSpy.resetHistory());
        after(() => warnSpy.restore());

        it("cancelButtonText without cancel handler", () => {
            testWarn(<Alert cancelButtonText="cancel" isOpen={false} />, Errors.ALERT_WARN_CANCEL_PROPS);
        });

        it("canEscapeKeyCancel without cancel handler", () => {
            testWarn(<Alert canEscapeKeyCancel={true} isOpen={false} />, Errors.ALERT_WARN_CANCEL_ESCAPE_KEY);
        });

        it("canOutsideClickCancel without cancel handler", () => {
            testWarn(<Alert canOutsideClickCancel={true} isOpen={false} />, Errors.ALERT_WARN_CANCEL_OUTSIDE_CLICK);
        });

        function testWarn(alert: JSX.Element, warning: string) {
            // one warning
            const wrapper = shallow(alert);
            assert.strictEqual(warnSpy.callCount, 1);
            assert.isTrue(warnSpy.calledWithExactly(warning));
            // no more warnings
            wrapper
                .setProps({ onClose: () => true })
                .setProps({ cancelButtonText: "cancel", onCancel: () => true, onClose: undefined });
            assert.strictEqual(warnSpy.callCount, 1);
        }
    });
});
