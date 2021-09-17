/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native'
import { DdSdkReactNativeConfiguration } from '../DdSdkReactNativeConfiguration'
import type { DdSdkConfiguration } from '../types'
import { DdSdk } from '../foundation'
import { DdSdkReactNative } from '../DdSdkReactNative'
import { DdRumUserInteractionTracking } from '../rum/instrumentation/DdRumUserInteractionTracking'
import { DdRumResourceTracking } from '../rum/instrumentation/DdRumResourceTracking'
import { DdRumErrorTracking } from '../rum/instrumentation/DdRumErrorTracking'
import { TrackingConsent } from '../TrackingConsent'
import { NativeSdkVerbosity } from '../NativeSdkVerbosity'
import { ProxyType } from '../ProxyConfiguration'

jest.mock('react-native', () => {
    return {
        NativeModules: {
            DdSdk: {
                initialize: jest.fn().mockResolvedValue(null),
                setUser: jest.fn().mockImplementation(() => { }),
                setAttributes: jest.fn().mockImplementation(() => { }),
                setTrackingConsent: jest.fn().mockImplementation(() => { })
            }
        }
    };
});

jest.mock('../rum/instrumentation/DdRumUserInteractionTracking', () => {
    return {
        DdRumUserInteractionTracking: {
            startTracking: jest.fn().mockImplementation(() => { })
        }
    }
})

jest.mock('../rum/instrumentation/DdRumResourceTracking', () => {
    return {
        DdRumResourceTracking: {
            startTracking: jest.fn().mockImplementation(() => { })
        }
    }
})

jest.mock('../rum/instrumentation/DdRumErrorTracking', () => {
    return {
        DdRumErrorTracking: {
            startTracking: jest.fn().mockImplementation(() => { })
        }
    }
})

beforeEach(async () => {
    DdSdkReactNative['wasInitialized'] = false;
    NativeModules.DdSdk.initialize.mockClear()
    NativeModules.DdSdk.setAttributes.mockClear()
    NativeModules.DdSdk.setUser.mockClear()
    NativeModules.DdSdk.setTrackingConsent.mockClear()

    DdRumUserInteractionTracking.startTracking.mockClear()
    DdRumResourceTracking.startTracking.mockClear()
    DdRumErrorTracking.startTracking.mockClear()
})

it('M initialize the SDK W initialize', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.trackingConsent).toBe(TrackingConsent.GRANTED)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
})

it('M give rejection W initialize', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId)

    NativeModules.DdSdk.initialize.mockRejectedValue('rejection')

    // WHEN
    await expect(DdSdkReactNative.initialize(configuration)).rejects.toMatch('rejection')

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.trackingConsent).toBe(TrackingConsent.GRANTED)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })

    expect(DdSdkReactNative["wasInitialized"]).toBe(false)
    expect(DdRumUserInteractionTracking.startTracking).toBeCalledTimes(0)
    expect(DdRumResourceTracking.startTracking).toBeCalledTimes(0)
    expect(DdRumErrorTracking.startTracking).toBeCalledTimes(0)

})

it('M initialize the SDK W initialize { explicit tracking consent }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const fakeConsent = TrackingConsent.NOT_GRANTED
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, false, fakeConsent)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.trackingConsent).toBe(fakeConsent)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
})

it('M initialize once W initialize { multiple times in a row }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)
    await DdSdkReactNative.initialize(configuration)
    await DdSdkReactNative.initialize(configuration)
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
})

it('M enable user interaction feature W initialize { user interaction config enabled }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, true)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
    expect(DdRumUserInteractionTracking.startTracking).toHaveBeenCalledTimes(1)
})

it('M enable resource tracking feature W initialize { resource tracking config enabled }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, true)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
    expect(DdRumResourceTracking.startTracking).toHaveBeenCalledTimes(1)
})

it('M enable error tracking feature W initialize { error tracking config enabled }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, true)

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false
    })
    expect(DdRumErrorTracking.startTracking).toHaveBeenCalledTimes(1)
})

it('M enable sdk verbosity W initialize { sdk verbosity }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, true)
    configuration.verbosity = NativeSdkVerbosity.DEBUG

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.sdk_verbosity': NativeSdkVerbosity.DEBUG,
        '_dd.native_view_tracking': false
    })
    expect(DdRumErrorTracking.startTracking).toHaveBeenCalledTimes(1)
})

it('M enable native view tracking W initialize { native_view_tracking enabled }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, true)
    configuration.nativeViewTracking = true

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': true
    })
    expect(DdRumErrorTracking.startTracking).toHaveBeenCalledTimes(1)
})

it('M call SDK method W setAttributes', async () => {
    // GIVEN
    const attributes = { "foo": "bar" }

    // WHEN

    DdSdkReactNative.setAttributes(attributes)

    // THEN
    expect(DdSdk.setAttributes).toHaveBeenCalledTimes(1)
    expect(DdSdk.setAttributes).toHaveBeenCalledWith(attributes)
})

it('M call SDK method W setUser', async () => {
    // GIVEN
    const user = { "foo": "bar" }

    // WHEN

    DdSdkReactNative.setUser(user)

    // THEN
    expect(DdSdk.setUser).toHaveBeenCalledTimes(1)
    expect(DdSdk.setUser).toHaveBeenCalledWith(user)
})

it('M call SDK method W setTrackingConsent', async () => {
    // GIVEN
    const consent = TrackingConsent.PENDING

    // WHEN

    DdSdkReactNative.setTrackingConsent(consent)

    // THEN
    expect(DdSdk.setTrackingConsent).toHaveBeenCalledTimes(1)
    expect(DdSdk.setTrackingConsent).toHaveBeenCalledWith(consent)
})

it('M set proxy configuration W initialize { with proxy config, without proxy credentials }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, false)
    configuration.proxyConfig = {
        type: ProxyType.HTTP,
        address: "1.1.1.1",
        port: 8080
    }

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false,
        '_dd.proxy.type': 'http',
        '_dd.proxy.address': '1.1.1.1',
        '_dd.proxy.port': 8080
    })
})

it('M set proxy configuration W initialize { with proxy config + proxy credentials }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, false)
    configuration.proxyConfig = {
        type: ProxyType.HTTP,
        address: "1.1.1.1",
        port: 8080,
        username: "foo",
        password: "bar"
    }

    NativeModules.DdSdk.initialize.mockResolvedValue(null)

    // WHEN
    await DdSdkReactNative.initialize(configuration)

    // THEN
    expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
    const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
    expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
    expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
    expect(ddSdkConfiguration.env).toBe(fakeEnvName)
    expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
        '_dd.source': 'react-native',
        '_dd.native_view_tracking': false,
        '_dd.proxy.type': 'http',
        '_dd.proxy.address': '1.1.1.1',
        '_dd.proxy.port': 8080,
        '_dd.proxy.username': 'foo',
        '_dd.proxy.password': 'bar'
    })
})

it('M log a warning W initialize { with socks proxy config + proxy credentials }', async () => {
    // GIVEN
    const fakeAppId = "1"
    const fakeClientToken = "2"
    const fakeEnvName = "env"
    const configuration = new DdSdkReactNativeConfiguration(fakeClientToken, fakeEnvName, fakeAppId, false, false, false)
    configuration.proxyConfig = {
        type: ProxyType.SOCKS,
        address: "1.1.1.1",
        port: 8080,
        username: "foo",
        password: "bar"
    }

    NativeModules.DdSdk.initialize.mockResolvedValue(null)
    const spyConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    try {
        // WHEN
        await DdSdkReactNative.initialize(configuration)

        // THEN
        expect(NativeModules.DdSdk.initialize.mock.calls.length).toBe(1);
        const ddSdkConfiguration = NativeModules.DdSdk.initialize.mock.calls[0][0] as DdSdkConfiguration
        expect(ddSdkConfiguration.clientToken).toBe(fakeClientToken)
        expect(ddSdkConfiguration.applicationId).toBe(fakeAppId)
        expect(ddSdkConfiguration.env).toBe(fakeEnvName)
        expect(ddSdkConfiguration.additionalConfig).toStrictEqual({
            '_dd.source': 'react-native',
            '_dd.native_view_tracking': false,
            '_dd.proxy.type': 'socks',
            '_dd.proxy.address': '1.1.1.1',
            '_dd.proxy.port': 8080
        })
        expect(spyConsoleWarn).toHaveBeenCalledTimes(1)
    } finally {
        spyConsoleWarn.mockRestore()
    }
})
